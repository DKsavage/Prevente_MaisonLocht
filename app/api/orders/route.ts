import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { orderSchema } from '@/lib/schemas'
import { generateReference } from '@/lib/generate-ref'
import { createServerClient } from '@/lib/supabase-server'
import { resend } from '@/lib/resend'
import { buildConfirmationEmail } from '@/lib/email-confirmation'
import { getPaymentMethod, generateInteracAnswer } from '@/lib/payment'
import { EMAIL_FROM } from '@/lib/email-from'

// Libère des pièces réservées (rollback si la commande échoue)
async function releasePieces(supabase: SupabaseClient, ids: string[]) {
  if (ids.length === 0) return
  await supabase
    .from('pieces')
    .update({ status: 'available', order_ref: null, reserved_at: null })
    .in('id', ids)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // ── Honeypot anti-bot : champ caché qui doit rester vide ──
    if (typeof body.website === 'string' && body.website.trim() !== '') {
      // Bot détecté — on simule un succès silencieux sans rien enregistrer
      return NextResponse.json({ reference: 'LOCHT-0000-000' }, { status: 201 })
    }

    const data = orderSchema.parse(body)
    const supabase = createServerClient()

    // ── Rate limiting : max 6 commandes / minute par IP ──
    const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown'
    const { data: allowed, error: rlErr } = await supabase.rpc('check_rate_limit', {
      p_key: `order:${ip}`, p_max: 6, p_window_seconds: 60,
    })
    if (!rlErr && allowed === false) {
      return NextResponse.json(
        { error: 'rate_limited' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }

    const reference = await generateReference()
    // Réponse de sécurité Interac (Canada uniquement)
    const interacAnswer = getPaymentMethod(data.country) === 'interac' ? generateInteracAnswer() : null

    // ── Réservation atomique des pièces (anti double-vente) ──
    // UPDATE conditionnel : ne réserve que si encore disponible.
    const reservedIds: string[] = []
    for (const piece of data.pieces) {
      const { data: updated, error: resErr } = await supabase
        .from('pieces')
        .update({ status: 'reserved', order_ref: reference, reserved_at: new Date().toISOString() })
        .eq('id', piece.id)
        .eq('status', 'available')
        .select('id')

      if (resErr) {
        await releasePieces(supabase, reservedIds)
        throw resErr
      }
      if (!updated || updated.length === 0) {
        // Déjà prise par quelqu'un d'autre → rollback + 409
        await releasePieces(supabase, reservedIds)
        return NextResponse.json(
          { error: 'piece_unavailable', pieceId: piece.id, modelName: piece.modelName, pieceNum: piece.pieceNum },
          { status: 409 }
        )
      }
      reservedIds.push(piece.id)
    }

    // ── Insertion de la commande ──
    const { error: orderErr } = await supabase.from('orders').insert({
      reference,
      status:      'pending',
      bag_name:    data.bagName,
      quantity:    data.quantity,
      price_total: data.priceTotal,
      first_name:  data.firstName,
      last_name:   data.lastName,
      email:       data.email,
      phone:       data.phone ?? null,
      address:     data.address,
      city:        data.city,
      province:    data.province ?? null,
      postal_code: data.postalCode,
      country:     data.country,
      lang:        data.lang,
      why_locht:   data.whyLocht ?? null,
      interac_answer: interacAnswer,
    })

    if (orderErr) {
      await releasePieces(supabase, reservedIds)
      throw orderErr
    }

    // Email client — non-bloquant : une commande reste valide même si l'email échoue.
    // Mode test : si RESEND_TEST_EMAIL est défini, tous les emails y sont redirigés.
    // Expéditeur — onboarding@resend.dev tant que maisonlocht.com n'est pas vérifié.
    // Quand le domaine est vérifié dans Resend, remplacer par 'Maison Locht <Ml@maisonlocht.com>'.
    const FROM = EMAIL_FROM
    const testEmail = (process.env.RESEND_TEST_EMAIL ?? '').replace(/\s/g, '')
    const toEmail   = testEmail || data.email
    // URL absolue pour les images de l'email (les chemins relatifs ne marchent pas en email)
    const baseUrl   = (process.env.NEXT_PUBLIC_SITE_URL?.replace(/\s/g, '') || req.nextUrl.origin).replace(/\/$/, '')
    try {
      await resend.emails.send({
        from: FROM,
        to:   toEmail,
        subject: data.lang === 'fr'
          ? `Maison Locht — Votre commande ${reference}`
          : `Maison Locht — Your order ${reference}`,
        html: buildConfirmationEmail({ data: { ...data, interacAnswer: interacAnswer ?? undefined, whyLocht: data.whyLocht ?? undefined }, reference, baseUrl }),
      })
    } catch (mailErr) {
      console.error('[orders POST] email failed (commande tout de même enregistrée)', mailErr)
    }

    // ── Notification interne (nouvelle commande) — supporte plusieurs emails séparés par virgule ──
    const adminTo = testEmail
      ? [testEmail]
      : (process.env.ADMIN_NOTIFY_EMAIL ?? '').split(',').map(e => e.trim()).filter(Boolean)
    if (adminTo.length > 0) {
      try {
        await resend.emails.send({
          from: FROM,
          to:   adminTo,
          replyTo: data.email,
          subject: `🔔 Nouvelle commande ${reference} — ${data.priceTotal} CAD`,
          html: buildAdminNotification({ data, reference, interacAnswer, baseUrl }),
        })
      } catch (e) {
        console.error('[orders POST] admin notify failed', e)
      }
    }

    return NextResponse.json({ reference }, { status: 201 })

  } catch (err) {
    console.error('[orders POST]', err)
    if (err instanceof Error && err.name === 'ZodError') {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// Email de notification interne (nouvelle commande) — pour la designeuse
function buildAdminNotification({ data, reference, interacAnswer, baseUrl }: {
  data: {
    firstName: string; lastName: string; email: string; phone?: string; bagName: string
    quantity: number; priceTotal: number; country: string; address: string; city: string
    province?: string; postalCode: string
  }
  reference: string
  interacAnswer: string | null
  baseUrl: string
}) {
  const payment = data.country === 'CA'
    ? `Interac &middot; réponse : <strong>${interacAnswer ?? '—'}</strong>`
    : 'Virement bancaire (compte belge)'
  return `
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;background:#ede8df;font-family:Helvetica,Arial,sans-serif;padding:32px 16px">
  <table width="520" cellpadding="0" cellspacing="0" align="center" style="background:#faf7f2;border:1px solid rgba(4,54,114,0.1);max-width:520px;margin:0 auto">
    <tr><td style="background:#043672;padding:24px 32px">
      <p style="margin:0;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#d4aa6a">Nouvelle commande</p>
      <p style="margin:6px 0 0;font-family:Georgia,serif;font-size:26px;font-weight:300;color:#fff">${reference}</p>
    </td></tr>
    <tr><td style="padding:24px 32px">
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#1a1a2e">
        <tr><td style="color:#7a7a8a;padding:4px 0">Client</td><td style="text-align:right;padding:4px 0">${data.firstName} ${data.lastName}</td></tr>
        <tr><td style="color:#7a7a8a;padding:4px 0">Courriel</td><td style="text-align:right;padding:4px 0">${data.email}</td></tr>
        ${data.phone ? `<tr><td style="color:#7a7a8a;padding:4px 0">Téléphone</td><td style="text-align:right;padding:4px 0">${data.phone}</td></tr>` : ''}
        <tr><td style="color:#7a7a8a;padding:4px 0">Pièces</td><td style="text-align:right;padding:4px 0">${data.bagName}</td></tr>
        <tr><td style="color:#7a7a8a;padding:4px 0">Total</td><td style="text-align:right;padding:4px 0;font-weight:600;color:#043672">${data.priceTotal} CAD</td></tr>
        <tr><td style="color:#7a7a8a;padding:4px 0">Pays</td><td style="text-align:right;padding:4px 0">${data.country}</td></tr>
        <tr><td style="color:#7a7a8a;padding:4px 0">Adresse</td><td style="text-align:right;padding:4px 0">${data.address}, ${data.city}${data.province ? ', ' + data.province : ''} ${data.postalCode}</td></tr>
        <tr><td style="color:#7a7a8a;padding:4px 0">Paiement</td><td style="text-align:right;padding:4px 0">${payment}</td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:0 32px 28px;text-align:center">
      <a href="${baseUrl}/admin/commandes" style="display:inline-block;background:#043672;color:#fff;font-size:10px;letter-spacing:3px;text-transform:uppercase;padding:13px 28px;text-decoration:none">Voir dans le tableau de bord &rarr;</a>
    </td></tr>
  </table>
</body></html>`
}
