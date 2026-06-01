import { NextRequest, NextResponse } from 'next/server'
import { orderSchema } from '@/lib/schemas'
import { generateReference } from '@/lib/generate-ref'
import { createServerClient } from '@/lib/supabase-server'
import { resend } from '@/lib/resend'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = orderSchema.parse(body)

    const reference = await generateReference()
    const supabase  = createServerClient()

    const { error } = await supabase.from('orders').insert({
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

    if (error) throw error

    // Email client
    const isDev = process.env.NODE_ENV !== 'production'
    const toEmail = isDev ? process.env.RESEND_TEST_EMAIL! : data.email

    await resend.emails.send({
      from: process.env.RESEND_FROM!,
      to:   toEmail,
      subject: data.lang === 'fr'
        ? `Maison Locht — Votre commande ${reference}`
        : `Maison Locht — Your order ${reference}`,
      html: buildEmailHtml({ data, reference }),
    })

    return NextResponse.json({ reference }, { status: 201 })

  } catch (err) {
    console.error('[orders POST]', err)
    if (err instanceof Error && err.name === 'ZodError') {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

function buildEmailHtml({ data, reference }: {
  data: { firstName: string; bagName: string; quantity: number; priceTotal: number; lang: string }
  reference: string
}) {
  const isFr = data.lang === 'fr'
  return `
<!DOCTYPE html>
<html lang="${data.lang}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ede8df;font-family:'DM Sans',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#faf7f2;border:1px solid rgba(4,54,114,0.08)">

        <!-- Header bleu -->
        <tr><td style="background:#043672;padding:32px 40px;text-align:center">
          <p style="margin:0;font-size:11px;letter-spacing:6px;text-transform:uppercase;color:rgba(255,255,255,0.5)">${isFr ? 'Confirmation de commande' : 'Order confirmation'}</p>
          <h1 style="margin:12px 0 0;font-family:Georgia,serif;font-size:28px;font-weight:300;color:#fff;letter-spacing:2px">Maison Locht</h1>
        </td></tr>

        <!-- Code référence -->
        <tr><td style="padding:36px 40px;text-align:center;border-bottom:1px solid rgba(4,54,114,0.06)">
          <p style="margin:0 0 8px;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#b8965a">${isFr ? 'Votre référence' : 'Your reference'}</p>
          <p style="margin:0;font-family:Georgia,serif;font-size:36px;font-weight:300;color:#043672;letter-spacing:4px">${reference}</p>
          <p style="margin:10px 0 0;font-size:11px;color:#7a7a8a">${isFr ? 'Conservez ce code — il vous permettra de suivre votre commande.' : 'Keep this code — you will use it to track your order.'}</p>
        </td></tr>

        <!-- Résumé -->
        <tr><td style="padding:28px 40px;border-bottom:1px solid rgba(4,54,114,0.06)">
          <p style="margin:0 0 16px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#b8965a">${isFr ? 'Résumé' : 'Summary'}</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:13px;color:#7a7a8a;padding-bottom:8px">${isFr ? 'Sac' : 'Bag'}</td>
              <td style="font-size:13px;color:#043672;text-align:right;padding-bottom:8px">${data.bagName}</td>
            </tr>
            <tr>
              <td style="font-size:13px;color:#7a7a8a;padding-bottom:8px">${isFr ? 'Quantité' : 'Quantity'}</td>
              <td style="font-size:13px;color:#043672;text-align:right;padding-bottom:8px">${data.quantity}</td>
            </tr>
            <tr>
              <td style="font-size:15px;font-weight:600;color:#043672;padding-top:8px;border-top:1px solid rgba(4,54,114,0.06)">${isFr ? 'Total' : 'Total'}</td>
              <td style="font-size:15px;font-weight:600;color:#043672;text-align:right;padding-top:8px;border-top:1px solid rgba(4,54,114,0.06)">${data.priceTotal} CAD</td>
            </tr>
          </table>
        </td></tr>

        <!-- Instructions paiement -->
        <tr><td style="padding:28px 40px;background:#f0ebe0">
          <p style="margin:0 0 12px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#b8965a">${isFr ? 'Instructions de paiement' : 'Payment instructions'}</p>
          <p style="margin:0 0 10px;font-size:13px;color:#1a1a2e;line-height:1.8">${isFr
            ? `Veuillez effectuer un <strong>virement Interac</strong> à l'adresse <strong>Ml@maisonlocht.com</strong> avec la référence <strong>${reference}</strong> en message.`
            : `Please send an <strong>Interac transfer</strong> to <strong>Ml@maisonlocht.com</strong> with reference <strong>${reference}</strong> as the message.`
          }</p>
          <p style="margin:0;font-size:12px;color:#7a7a8a">${isFr
            ? 'Votre commande sera confirmée dès réception du paiement.'
            : 'Your order will be confirmed upon receipt of payment.'
          }</p>
        </td></tr>

        <!-- Suivi -->
        <tr><td style="padding:24px 40px;text-align:center">
          <p style="margin:0 0 14px;font-size:12px;color:#7a7a8a">${isFr ? 'Suivez votre commande en ligne :' : 'Track your order online:'}</p>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://maisonlocht.com'}/commande/${reference}"
            style="display:inline-block;background:#043672;color:#fff;font-size:10px;letter-spacing:3px;text-transform:uppercase;padding:14px 28px;text-decoration:none">
            ${isFr ? 'Suivre ma commande →' : 'Track my order →'}
          </a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 40px;border-top:1px solid rgba(4,54,114,0.06);text-align:center">
          <p style="margin:0;font-size:10px;color:#7a7a8a;letter-spacing:1px">Maison Locht · ${isFr ? 'Pièces uniques, jamais reproduites' : 'One-of-a-kind pieces, never reproduced'}</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}
