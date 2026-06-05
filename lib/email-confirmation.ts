import { getPaymentMethod, BANK_DETAILS, INTERAC_EMAIL, INTERAC_SECURITY_QUESTION } from './payment'
import { emailImg } from './email-from'

function esc(s: string | null | undefined): string {
  return (s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

export type ConfirmationData = {
  firstName: string; bagName: string; quantity: number; priceTotal: number; lang: string
  pieces?: { modelName: string; pieceNum: number; price: number; src: string }[]
  address?: string; city?: string; province?: string; postalCode?: string; country?: string
  interacAnswer?: string
  errorCorrection?: boolean
  correctionNote?: string
  whyLocht?: string
}

// ─── Blocs réutilisables ──────────────────────────────────────────────────

function divider() {
  return `<tr><td style="height:1px;background:rgba(212,170,106,0.18);font-size:0;line-height:0">&nbsp;</td></tr>`
}

function stepCard(num: string, label: string, content: string) {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:2px">
    <tr>
      <td style="padding:22px 40px 20px;border-left:3px solid #b8965a">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <p style="margin:0 0 12px;font-family:Georgia,serif;font-size:28px;font-weight:300;color:#b8965a;line-height:1;letter-spacing:2px">${num}</p>
              <p style="margin:0 0 14px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.45)">${label}</p>
              ${content}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`
}

function coordCard(rows: string) {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(212,170,106,0.25)">
    ${rows}
  </table>`
}

// copyHint : affiche un petit label "appuyer pour sélectionner" quand copyable=true
function coordRow(label: string, value: string, opts: { last?: boolean; copyable?: boolean; mailto?: boolean } = {}) {
  const { last = false, copyable = false, mailto = false } = opts
  const selectStyle = copyable
    ? 'user-select:all;-webkit-user-select:all;-moz-user-select:all;cursor:text;'
    : ''
  const valueHtml = mailto
    ? `<a href="mailto:${value}" style="color:#d4aa6a;text-decoration:none;font-size:15px;font-weight:600;letter-spacing:0.5px;word-break:break-all;${selectStyle}">${value}</a>`
    : `<span style="font-size:15px;color:#d4aa6a;font-weight:600;letter-spacing:0.5px;word-break:break-all;${selectStyle}">${value}</span>`

  return `
  <tr><td style="padding:13px 16px">
    <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.4)">${label}</p>
    <p style="margin:0">${valueHtml}</p>
  </td></tr>
  ${last ? '' : `<tr><td style="height:1px;background:rgba(212,170,106,0.12);font-size:0">&nbsp;</td></tr>`}`
}

function refBox(reference: string, instruction: string, context: string) {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="border:2px solid #b8965a;background:rgba(212,170,106,0.08)">
    <tr><td style="padding:20px 24px;text-align:center">
      <p style="margin:0 0 10px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(212,170,106,0.65)">${instruction}</p>
      <p style="margin:0 0 10px;font-family:Courier,monospace;font-size:26px;color:#d4aa6a;letter-spacing:6px;font-weight:700;word-break:break-all;user-select:all;-webkit-user-select:all;-moz-user-select:all;cursor:text">${reference}</p>
      <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.38);line-height:1.7">${context}</p>
    </td></tr>
  </table>`
}

function causeEffect(isFr: boolean) {
  const left  = isFr ? 'Virement re&#231;u' : 'Transfer received'
  const right = isFr ? 'Exp&#233;dition pr&#233;par&#233;e' : 'Shipment prepared'
  return `
  <tr><td style="background:rgba(4,54,114,0.5);padding:18px 40px;border-top:1px solid rgba(212,170,106,0.2)">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="text-align:center;width:44%">
          <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:rgba(212,170,106,0.6)">${isFr ? '&#201;tape 1' : 'Step 1'}</p>
          <p style="margin:0;font-size:14px;color:#fff;line-height:1.5">${left}</p>
        </td>
        <td style="text-align:center;width:12%;font-family:Georgia,serif;font-size:22px;color:#b8965a">&#8594;</td>
        <td style="text-align:center;width:44%">
          <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:rgba(212,170,106,0.6)">${isFr ? '&#201;tape 2' : 'Step 2'}</p>
          <p style="margin:0;font-size:14px;color:#fff;line-height:1.5">${right}</p>
        </td>
      </tr>
    </table>
  </td></tr>`
}

// ─── Blocs paiement ───────────────────────────────────────────────────────

function paymentSteps(
  method: 'interac' | 'bank',
  amount: number,
  reference: string,
  isFr: boolean,
  interacAnswer?: string
) {
  const methodLabel = method === 'interac'
    ? (isFr ? 'par virement Interac' : 'by Interac transfer')
    : (isFr ? 'par virement bancaire (SEPA/international)' : 'by bank transfer (SEPA/international)')

  // Étape 1 — montant
  const step1 = stepCard('01.', isFr ? 'Montant total à régler' : 'Total amount to send', `
    <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:48px;font-weight:300;color:#d4aa6a;line-height:1;letter-spacing:-1px">${amount}</p>
    <p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.38)">CAD &middot; ${methodLabel}</p>
  `)

  // Étape 2 — coordonnées
  let coordRows = ''
  if (method === 'interac') {
    const q = isFr ? INTERAC_SECURITY_QUESTION.fr : INTERAC_SECURITY_QUESTION.en
    coordRows = [
      coordRow(isFr ? 'Adresse Interac' : 'Interac address', INTERAC_EMAIL, { copyable: true, mailto: true }),
      ...(interacAnswer
        ? [
            coordRow(isFr ? 'Question de s&#233;curit&#233;' : 'Security question', q, { copyable: true }),
            coordRow(isFr ? 'R&#233;ponse automatique' : 'Auto-reply', interacAnswer, { copyable: true, last: true }),
          ]
        : [coordRow(isFr ? 'Message' : 'Message', reference, { copyable: true, last: true })]),
    ].join('')
  } else {
    coordRows = [
      coordRow(isFr ? 'Titulaire' : 'Account holder', BANK_DETAILS.holder),
      coordRow('IBAN', BANK_DETAILS.iban, { copyable: true }),
      coordRow('BIC / SWIFT', BANK_DETAILS.bic, { copyable: true }),
      coordRow(isFr ? 'Banque' : 'Bank', BANK_DETAILS.bankName, { last: true }),
    ].join('')
  }

  const step2 = stepCard(
    '02.',
    isFr ? 'Coordonn&#233;es de paiement' : 'Payment details',
    coordCard(coordRows)
  )

  // Étape 3 — référence
  const refInstruction  = isFr ? 'Copiez exactement cette r&#233;f&#233;rence' : 'Copy this reference exactly'
  const refContext = method === 'interac'
    ? (isFr ? 'Dans le champ &laquo;&nbsp;Message&nbsp;&raquo; de votre virement Interac' : 'In the "Message" field of your Interac transfer')
    : (isFr ? 'Dans le champ &laquo;&nbsp;Communication&nbsp;&raquo; de votre virement bancaire' : 'In the "Description" field of your bank transfer')

  const step3 = stepCard(
    '03.',
    isFr ? 'R&#233;f&#233;rence &#224; inclure' : 'Reference to include',
    refBox(reference, refInstruction, refContext)
  )

  return step1 + step2 + step3
}

// ─── Header de correction ─────────────────────────────────────────────────

function correctionHeader(isFr: boolean) {
  return `
  <tr><td style="background:#b8965a;padding:36px 40px;text-align:center">
    <p style="margin:0 0 10px;font-size:10px;letter-spacing:5px;text-transform:uppercase;color:rgba(255,255,255,0.75)">
      ${isFr ? '&#9888;&#xFE0E;&nbsp; Correction &nbsp;&#9888;&#xFE0E;' : '&#9888;&#xFE0E;&nbsp; Correction &nbsp;&#9888;&#xFE0E;'}
    </p>
    <h1 style="margin:0;font-family:Georgia,serif;font-size:28px;font-weight:300;color:#fff;letter-spacing:3px">Maison Locht</h1>
    <p style="margin:10px 0 0;font-size:12px;color:rgba(255,255,255,0.7);line-height:1.6">
      ${isFr ? 'Un email vous a &#233;t&#233; envoy&#233; par erreur' : 'An email was sent to you by mistake'}
    </p>
  </td></tr>`
}

function correctionExplanation(firstName: string, isFr: boolean, customNote?: string) {
  const noteBlock = customNote ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;border-left:3px solid #b8965a;background:#fff">
      <tr><td style="padding:14px 18px">
        <p style="margin:0 0 4px;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#b8965a">
          ${isFr ? 'Un mot de Maison Locht' : 'A note from Maison Locht'}
        </p>
        <p style="margin:0;font-family:Georgia,serif;font-size:13px;font-weight:300;font-style:italic;color:#043672;line-height:1.7">
          &laquo;&#160;${esc(customNote)}&#160;&raquo;
        </p>
      </td></tr>
    </table>` : ''

  return `
  <tr><td style="padding:28px 40px 8px">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-left:4px solid #b8965a;background:#f9f6f1">
      <tr><td style="padding:20px 24px">
        <p style="margin:0 0 6px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#b8965a">
          ${isFr ? 'Ce qui s\'est pass&#233;' : 'What happened'}
        </p>
        <p style="margin:0 0 14px;font-size:14px;color:#1a1a2e;line-height:1.8">
          ${isFr
            ? `${esc(firstName)}, nous vous avons envoy&#233; un email de confirmation par erreur. Votre commande est bien enregistr&#233;e&#160;— mais votre paiement n&rsquo;a pas encore &#233;t&#233; re&#231;u.`
            : `${esc(firstName)}, we sent you a confirmation email by mistake. Your order is registered&#160;— but your payment has not been received yet.`}
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#043672">
          <tr><td style="padding:14px 18px">
            <p style="margin:0;font-size:13px;color:#fff;font-weight:600;line-height:1.6;letter-spacing:0.2px">
              ${isFr
                ? '&#8594;&#160; Ignorez l&rsquo;email pr&#233;c&#233;dent et suivez les instructions ci-dessous pour finaliser votre achat.'
                : '&#8594;&#160; Please ignore the previous email and follow the instructions below to complete your purchase.'}
            </p>
          </td></tr>
        </table>
        ${noteBlock}
      </td></tr>
    </table>
  </td></tr>`
}

// ─── Email de confirmation ────────────────────────────────────────────────

export function buildConfirmationEmail({ data, reference, baseUrl }: {
  data: ConfirmationData
  reference: string
  baseUrl: string
}) {
  const isFr   = data.lang === 'fr'
  const method = getPaymentMethod(data.country ?? '')
  const pieces = data.pieces ?? []

  const pieceRows = pieces.map(p => {
    const num = String(p.pieceNum).padStart(2, '0')
    const img = emailImg(p.src, baseUrl)
    return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px">
      <tr>
        <td width="92" style="vertical-align:top">
          <img src="${img}" width="80" height="80" alt="${p.modelName}"
               style="display:block;width:80px;height:80px;object-fit:cover;border:1px solid rgba(4,54,114,0.1)" />
        </td>
        <td style="vertical-align:middle;padding-left:10px">
          <p style="margin:0;font-family:Georgia,serif;font-size:18px;font-weight:300;color:#043672;font-style:italic">${p.modelName}</p>
          <p style="margin:5px 0 0;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#b8965a">
            ${isFr ? 'Pi&#232;ce' : 'Piece'} N&#176;${num} &middot; unique
          </p>
        </td>
        <td style="vertical-align:middle;text-align:right;white-space:nowrap">
          <p style="margin:0;font-family:Georgia,serif;font-size:16px;font-weight:300;color:#043672">
            ${p.price}<span style="font-size:10px;color:#7a7a8a"> CAD</span>
          </p>
        </td>
      </tr>
    </table>`
  }).join('')

  const fullAddress = [
    esc(data.address),
    `${esc(data.city)}${data.province ? ', ' + esc(data.province) : ''} ${esc(data.postalCode)}`.trim(),
    esc(data.country),
  ].filter(Boolean).join('<br>')

  const isCorrection = data.errorCorrection === true

  return `
<!DOCTYPE html>
<html lang="${data.lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${isCorrection ? 'Correction' : 'Maison Locht'} &mdash; ${reference}</title>
</head>
<body style="margin:0;padding:0;background:#ede8df;font-family:Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
  <tr><td align="center">
  <table width="580" cellpadding="0" cellspacing="0"
         style="background:#faf7f2;border:1px solid rgba(4,54,114,0.08);max-width:580px;width:100%">

    ${isCorrection
      /* ── En-tête correction (ambre) ── */
      ? correctionHeader(isFr)
      /* ── En-tête standard (marine) ── */
      : `<tr><td style="background:#043672;padding:40px;text-align:center">
           <p style="margin:0 0 14px;font-size:10px;letter-spacing:5px;text-transform:uppercase;color:#d4aa6a">
             ${isFr ? 'Commande enregistr&#233;e' : 'Order registered'}
           </p>
           <h1 style="margin:0;font-family:Georgia,serif;font-size:30px;font-weight:300;color:#fff;letter-spacing:3px">Maison Locht</h1>
           <p style="margin:8px 0 0;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.4)">
             LOCHT 01 &middot; Les Cernes
           </p>
         </td></tr>`}

    ${isCorrection
      /* ── Explication correction ── */
      ? correctionExplanation(data.firstName, isFr, data.correctionNote)
      /* ── Salutation standard ── */
      : `<tr><td style="padding:36px 40px 20px">
           <p style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:300;font-style:italic;color:#043672">
             ${isFr ? `Merci,&#160;${esc(data.firstName)}.` : `Thank you,&#160;${esc(data.firstName)}.`}
           </p>
           <p style="margin:12px 0 0;font-size:13px;line-height:1.8;color:#7a7a8a">
             ${isFr
               ? 'Votre pi&#232;ce vous attend. Voici le r&#233;capitulatif et les instructions pour finaliser.'
               : 'Your piece awaits. Here is your summary and the steps to complete your order.'}
           </p>
         </td></tr>`}

    <!-- why_locht -->
    ${data.whyLocht && !isCorrection ? `
    <tr><td style="padding:0 40px 16px">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-left:3px solid #b8965a;background:#f9f6f1">
        <tr><td style="padding:16px 20px">
          <p style="margin:0 0 6px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#b8965a">
            ${isFr ? 'Vous nous avez confi&#233;' : 'You told us'}
          </p>
          <p style="margin:0 0 10px;font-family:Georgia,serif;font-size:14px;font-weight:300;font-style:italic;color:#043672;line-height:1.7">
            &laquo;&#160;${esc(data.whyLocht)}&#160;&raquo;
          </p>
          <p style="margin:0;font-size:12px;color:#7a7a8a;line-height:1.6">
            ${isFr ? 'Nous l&rsquo;avons gard&#233; en t&#234;te en pr&#233;parant votre pi&#232;ce.' : 'We kept it in mind while preparing your piece.'}
          </p>
        </td></tr>
      </table>
    </td></tr>` : ''}

    <!-- Pièces commandées -->
    ${pieces.length > 0 ? `
    <tr><td style="padding:${isCorrection ? '16px' : '0'} 40px 24px">
      <p style="margin:0 0 16px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#b8965a">
        ${isFr ? (isCorrection ? 'Votre commande' : 'Vos pi&#232;ces') : (isCorrection ? 'Your order' : 'Your pieces')}
      </p>
      ${pieceRows}
      <table width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid rgba(4,54,114,0.1)">
        <tr>
          <td style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#043672;padding-top:14px">Total</td>
          <td style="text-align:right;font-family:Georgia,serif;font-size:24px;font-weight:300;color:#043672;padding-top:14px">
            ${data.priceTotal}<span style="font-size:12px;color:#7a7a8a"> CAD</span>
          </td>
        </tr>
      </table>
    </td></tr>` : ''}

    <!-- Bloc paiement — 3 étapes éditoriales -->
    <tr><td style="background:#021f45;padding:28px 0 0">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:0 40px 22px">
          <p style="margin:0 0 6px;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#d4aa6a">
            ${isFr ? '&mdash;&#160;Action requise pour l&rsquo;exp&#233;dition&#160;&mdash;' : '&mdash;&#160;Action required to ship&#160;&mdash;'}
          </p>
          <p style="margin:0;font-family:Georgia,serif;font-size:18px;font-weight:300;color:rgba(255,255,255,0.85);line-height:1.6">
            ${isFr
              ? `Envoyez votre r&#232;glement${method === 'interac' ? ' Interac' : ' bancaire'} en suivant les 3 &#233;tapes ci-dessous. D&#232;s r&#233;ception, nous pr&#233;parons votre exp&#233;dition.`
              : `Send your ${method === 'interac' ? 'Interac' : 'wire'} payment following the 3 steps below. Once received, we prepare your shipment.`}
          </p>
        </td></tr>
        ${divider()}
        <tr><td style="background:#021f45">
          ${paymentSteps(method, data.priceTotal, reference, isFr, data.interacAnswer)}
        </td></tr>
        ${causeEffect(isFr)}
      </table>
    </td></tr>

    <!-- Adresse de livraison -->
    ${fullAddress ? `
    <tr><td style="padding:26px 40px;border-bottom:1px solid rgba(4,54,114,0.06)">
      <p style="margin:0 0 10px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#b8965a">
        ${isFr ? 'Livraison' : 'Delivery'}
      </p>
      <p style="margin:0;font-size:13px;line-height:1.8;color:#043672">${fullAddress}</p>
    </td></tr>` : ''}

    <!-- CTA tracking -->
    <tr><td style="padding:32px 40px 16px;text-align:center">
      <a href="${baseUrl}/commande/${reference}"
         style="display:inline-block;background:#043672;color:#fff;font-size:10px;letter-spacing:3px;text-transform:uppercase;padding:16px 36px;text-decoration:none">
        ${isFr ? 'Suivre ma commande' : 'Track my order'} &rarr;
      </a>
    </td></tr>

    <tr><td style="padding:0 40px 28px;text-align:center">
      <p style="margin:0;font-size:10px;color:#7a7a8a;line-height:1.7">
        ${isFr
          ? 'Pi&#232;ce unique &middot; ni reprise ni &#233;change. Des ajustements sur le sac restent possibles sur demande.'
          : 'One-of-a-kind &middot; no returns or exchanges. Adjustments to the bag remain available on request.'}
      </p>
    </td></tr>

    <!-- Footer -->
    <tr><td style="padding:22px 40px;background:#021f45;text-align:center">
      <p style="margin:0;font-size:9px;color:rgba(255,255,255,0.4);letter-spacing:2px;text-transform:uppercase">
        ${isFr ? 'Pi&#232;ces uniques, jamais reproduites' : 'One-of-a-kind pieces, never reproduced'}
      </p>
    </td></tr>

  </table>
  </td></tr>
</table>
</body>
</html>`
}
