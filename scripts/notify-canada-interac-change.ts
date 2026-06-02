/**
 * Script one-time — à exécuter UNE SEULE FOIS.
 * Notifie les clients canadiens (pending/payment_received) que l'adresse Interac a changé.
 *
 * Usage :
 *   npx tsx scripts/notify-canada-interac-change.ts
 *
 * Requires .env.local avec SUPABASE_SERVICE_ROLE_KEY + RESEND_API_KEY + NEXT_PUBLIC_SITE_URL
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const OLD_EMAIL = 'Ml@maisonlocht.com'
const NEW_EMAIL = 'anouklocht2003@gmail.com'
const BASE_URL  = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://prevente.maisonlocht.com').replace(/\/$/, '')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)
const resend = new Resend((process.env.RESEND_API_KEY ?? '').replace(/\s/g, ''))
const FROM   = 'Maison Locht <ml@maisonlocht.com>'

function buildEmail(firstName: string, reference: string, lang: string, interacAnswer: string | null) {
  const isFr = lang === 'fr'
  const subject = isFr
    ? `Maison Locht — Mise à jour de votre virement Interac (${reference})`
    : `Maison Locht — Update on your Interac transfer (${reference})`

  const answerNote = interacAnswer
    ? (isFr
        ? `<p style="margin:8px 0 0;font-size:13px;color:#1a1a2e">Votre réponse de sécurité reste inchangée : <strong>${interacAnswer}</strong></p>`
        : `<p style="margin:8px 0 0;font-size:13px;color:#1a1a2e">Your security answer remains unchanged: <strong>${interacAnswer}</strong></p>`)
    : ''

  const html = `
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;background:#ede8df;font-family:Helvetica,Arial,sans-serif;padding:32px 16px">
  <table width="560" cellpadding="0" cellspacing="0" align="center" style="background:#faf7f2;border:1px solid rgba(4,54,114,0.1);max-width:560px;margin:0 auto">
    <tr><td style="background:#043672;padding:28px 36px">
      <p style="margin:0;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#d4aa6a">
        ${isFr ? 'Information importante' : 'Important information'}
      </p>
      <p style="margin:6px 0 0;font-family:Georgia,serif;font-size:26px;font-weight:300;color:#fff">Maison Locht</p>
    </td></tr>
    <tr><td style="padding:28px 36px">
      <p style="margin:0;font-family:Georgia,serif;font-size:20px;font-weight:300;font-style:italic;color:#043672">
        ${isFr ? `${firstName},` : `${firstName},`}
      </p>
      <p style="margin:16px 0 0;font-size:13px;line-height:1.8;color:#1a1a2e">
        ${isFr
          ? `Nous avons mis à jour notre adresse de réception Interac. Si vous n'avez pas encore effectué votre virement, veuillez utiliser la nouvelle adresse ci-dessous.`
          : `We have updated our Interac receiving address. If you have not yet completed your transfer, please use the new address below.`}
      </p>
      ${isFr
        ? `<p style="margin:12px 0 0;font-size:13px;line-height:1.8;color:#7a7a8a">Si vous avez déjà envoyé le virement à <strong>${OLD_EMAIL}</strong>, veuillez contacter votre banque pour annuler et renvoyer à la nouvelle adresse.</p>`
        : `<p style="margin:12px 0 0;font-size:13px;line-height:1.8;color:#7a7a8a">If you already sent the transfer to <strong>${OLD_EMAIL}</strong>, please contact your bank to cancel it and resend to the new address.</p>`}
    </td></tr>
    <tr><td style="padding:0 36px 28px;background:#f0ebe0;margin:0 36px">
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 0;padding:24px 0 0">
        <tr>
          <td style="font-size:11px;color:#7a7a8a;padding:4px 0">${isFr ? 'Nouvelle adresse Interac' : 'New Interac address'}</td>
          <td style="font-size:14px;color:#043672;text-align:right;font-weight:600;padding:4px 0">${NEW_EMAIL}</td>
        </tr>
        <tr>
          <td style="font-size:11px;color:#7a7a8a;padding:4px 0">${isFr ? 'Référence (dans le message)' : 'Reference (in message)'}</td>
          <td style="font-size:14px;color:#043672;text-align:right;font-weight:600;padding:4px 0">${reference}</td>
        </tr>
      </table>
      ${answerNote}
    </td></tr>
    <tr><td style="padding:20px 36px;text-align:center">
      <a href="${BASE_URL}/commande/${reference}"
        style="display:inline-block;background:#043672;color:#fff;font-size:10px;letter-spacing:3px;text-transform:uppercase;padding:13px 28px;text-decoration:none">
        ${isFr ? 'Suivre ma commande' : 'Track my order'} &rarr;
      </a>
    </td></tr>
    <tr><td style="padding:20px 36px;background:#021f45;text-align:center">
      <p style="margin:0;font-size:9px;color:rgba(255,255,255,0.4);letter-spacing:2px;text-transform:uppercase">
        ${isFr ? 'Désolée pour ce changement — merci de votre confiance.' : 'Sorry for the change — thank you for your trust.'}
      </p>
    </td></tr>
  </table>
</body></html>`

  return { subject, html }
}

async function main() {
  console.log('Recherche des commandes canadiennes en attente...')

  const { data: orders, error } = await supabase
    .from('orders')
    .select('reference, first_name, email, lang, interac_answer, status, country')
    .eq('country', 'CA')
    .in('status', ['pending', 'payment_received'])

  if (error) {
    console.error('Erreur Supabase :', error)
    process.exit(1)
  }

  if (!orders || orders.length === 0) {
    console.log('Aucune commande canadienne en attente. Rien à faire.')
    return
  }

  console.log(`${orders.length} commande(s) trouvée(s) :`)
  orders.forEach(o => console.log(`  - ${o.reference} | ${o.first_name} | ${o.email} | ${o.status}`))
  console.log()

  for (const order of orders) {
    const { subject, html } = buildEmail(order.first_name, order.reference, order.lang, order.interac_answer)
    try {
      await resend.emails.send({ from: FROM, to: order.email, subject, html })
      console.log(`✓ Email envoyé → ${order.email} (${order.reference})`)
    } catch (err) {
      console.error(`✗ Échec → ${order.email} (${order.reference}) :`, err)
    }
  }

  console.log('\nTerminé.')
}

main()
