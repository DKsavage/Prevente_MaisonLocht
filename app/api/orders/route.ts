import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { orderSchema } from '@/lib/schemas'
import { generateReference } from '@/lib/generate-ref'
import { createServerClient } from '@/lib/supabase-server'
import { resend } from '@/lib/resend'
import { buildConfirmationEmail } from '@/lib/email-confirmation'

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
    })

    if (orderErr) {
      await releasePieces(supabase, reservedIds)
      throw orderErr
    }

    // Email client — non-bloquant : une commande reste valide même si l'email échoue.
    // Mode test : si RESEND_TEST_EMAIL est défini, tous les emails y sont redirigés.
    // Expéditeur — onboarding@resend.dev tant que maisonlocht.com n'est pas vérifié.
    // Quand le domaine est vérifié dans Resend, remplacer par 'Maison Locht <Ml@maisonlocht.com>'.
    const FROM = 'Maison Locht <onboarding@resend.dev>'
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
        html: buildConfirmationEmail({ data, reference, baseUrl }),
      })
    } catch (mailErr) {
      console.error('[orders POST] email failed (commande tout de même enregistrée)', mailErr)
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
