import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { orderSchema } from '@/lib/schemas'
import { generateReference } from '@/lib/generate-ref'
import { createServerClient } from '@/lib/supabase-server'
import { resend } from '@/lib/resend'
import { getPaymentMethod, paymentInstructions } from '@/lib/payment'

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
        html: buildEmailHtml({ data, reference, baseUrl }),
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

function buildEmailHtml({ data, reference, baseUrl }: {
  data: {
    firstName: string; bagName: string; quantity: number; priceTotal: number; lang: string
    pieces?: { modelName: string; pieceNum: number; price: number; src: string }[]
    address?: string; city?: string; province?: string; postalCode?: string; country?: string
  }
  reference: string
  baseUrl: string
}) {
  const isFr = data.lang === 'fr'
  const pieces = data.pieces ?? []
  const pay = paymentInstructions(getPaymentMethod(data.country ?? ''), reference, isFr ? 'fr' : 'en')

  // Cartes pièces avec image (URL absolue)
  const pieceRows = pieces.map(p => {
    const num = String(p.pieceNum).padStart(2, '0')
    const img = `${baseUrl}${p.src}`
    return `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px">
        <tr>
          <td width="92" style="vertical-align:top">
            <img src="${img}" width="80" height="80" alt="${p.modelName}" style="display:block;width:80px;height:80px;object-fit:cover;border:1px solid rgba(4,54,114,0.1)" />
          </td>
          <td style="vertical-align:middle;padding-left:4px">
            <p style="margin:0;font-family:Georgia,serif;font-size:18px;font-weight:300;color:#043672;font-style:italic">${p.modelName}</p>
            <p style="margin:4px 0 0;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#b8965a">${isFr ? 'Pièce' : 'Piece'} N°${num} &middot; ${isFr ? 'unique' : 'unique'}</p>
          </td>
          <td style="vertical-align:middle;text-align:right">
            <p style="margin:0;font-family:Georgia,serif;font-size:16px;font-weight:300;color:#043672">${p.price}<span style="font-size:10px;color:#7a7a8a"> CAD</span></p>
          </td>
        </tr>
      </table>`
  }).join('')

  const fullAddress = [data.address, `${data.city ?? ''}${data.province ? ', ' + data.province : ''} ${data.postalCode ?? ''}`.trim(), data.country]
    .filter(Boolean).join('<br>')

  return `
<!DOCTYPE html>
<html lang="${data.lang}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ede8df;font-family:Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#faf7f2;border:1px solid rgba(4,54,114,0.08);max-width:580px;width:100%">

        <!-- Header bleu -->
        <tr><td style="background:#043672;padding:40px;text-align:center">
          <p style="margin:0 0 14px;font-size:10px;letter-spacing:5px;text-transform:uppercase;color:#d4aa6a">${isFr ? 'Commande confirmée' : 'Order confirmed'}</p>
          <h1 style="margin:0;font-family:Georgia,serif;font-size:30px;font-weight:300;color:#fff;letter-spacing:3px">Maison Locht</h1>
          <p style="margin:8px 0 0;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.4)">LOCHT 01 &middot; Les Cernes</p>
        </td></tr>

        <!-- Salutation -->
        <tr><td style="padding:36px 40px 20px">
          <p style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:300;font-style:italic;color:#043672">${isFr ? `Merci, ${data.firstName}.` : `Thank you, ${data.firstName}.`}</p>
          <p style="margin:12px 0 0;font-size:13px;line-height:1.8;color:#7a7a8a">${isFr
            ? 'Votre pièce vous attend. Voici le récapitulatif de votre commande.'
            : 'Your piece awaits. Here is your order summary.'}</p>
        </td></tr>

        <!-- Pièces -->
        <tr><td style="padding:0 40px 24px">
          <p style="margin:0 0 16px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#b8965a">${isFr ? 'Vos pièces' : 'Your pieces'}</p>
          ${pieceRows}
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;border-top:2px solid rgba(4,54,114,0.1)">
            <tr>
              <td style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#043672;padding-top:14px">${isFr ? 'Total' : 'Total'}</td>
              <td style="text-align:right;font-family:Georgia,serif;font-size:24px;font-weight:300;color:#043672;padding-top:14px">${data.priceTotal}<span style="font-size:12px;color:#7a7a8a"> CAD</span></td>
            </tr>
          </table>
        </td></tr>

        <!-- Référence -->
        <tr><td style="padding:28px 40px;background:#043672;text-align:center">
          <p style="margin:0 0 8px;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:rgba(255,255,255,0.4)">${isFr ? 'Votre référence' : 'Your reference'}</p>
          <p style="margin:0;font-family:Georgia,serif;font-size:30px;font-weight:300;color:#fff;letter-spacing:4px">${reference}</p>
        </td></tr>

        <!-- Instructions paiement (selon le pays) -->
        <tr><td style="padding:28px 40px;background:#f0ebe0">
          <p style="margin:0 0 12px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#b8965a">${pay.title}</p>
          ${pay.lines.map(l => `<p style="margin:0 0 10px;font-size:13px;color:#1a1a2e;line-height:1.8">${l}</p>`).join('')}
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 4px">
            ${pay.fields.map(f => `
              <tr>
                <td style="font-size:11px;color:#7a7a8a;padding:3px 0">${f.label}</td>
                <td style="font-size:13px;color:#043672;text-align:right;padding:3px 0;font-weight:600">${f.value}</td>
              </tr>`).join('')}
          </table>
          <p style="margin:8px 0 0;font-size:12px;color:#7a7a8a">${isFr
            ? 'Votre commande sera confirmée dès réception du paiement.'
            : 'Your order will be confirmed upon receipt of payment.'}</p>
        </td></tr>

        <!-- Livraison -->
        <tr><td style="padding:24px 40px;border-bottom:1px solid rgba(4,54,114,0.06)">
          <p style="margin:0 0 10px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#b8965a">${isFr ? 'Livraison' : 'Delivery'}</p>
          <p style="margin:0;font-size:13px;line-height:1.7;color:#043672">${fullAddress}</p>
        </td></tr>

        <!-- Suivi -->
        <tr><td style="padding:28px 40px 16px;text-align:center">
          <a href="${baseUrl}/commande/${reference}"
            style="display:inline-block;background:#043672;color:#fff;font-size:10px;letter-spacing:3px;text-transform:uppercase;padding:15px 32px;text-decoration:none">
            ${isFr ? 'Suivre ma commande' : 'Track my order'} &rarr;
          </a>
        </td></tr>

        <!-- Vente finale -->
        <tr><td style="padding:0 40px 24px;text-align:center">
          <p style="margin:0;font-size:10px;color:#7a7a8a;line-height:1.7">${isFr
            ? 'Pièce unique &middot; ni reprise ni échange. Des ajustements sur le sac restent possibles sur demande.'
            : 'One-of-a-kind &middot; no returns or exchanges. Adjustments to the bag remain available on request.'}</p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 40px;background:#021f45;text-align:center">
          <p style="margin:0;font-size:9px;color:rgba(255,255,255,0.4);letter-spacing:2px;text-transform:uppercase">${isFr ? 'Pièces uniques, jamais reproduites' : 'One-of-a-kind pieces, never reproduced'}</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}
