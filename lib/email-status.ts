// Templates email de changement de statut (paiement reçu / expédition).
// Le shell, l'en-tête, le pied de page, le bloc photos et le CTA sont mutualisés
// entre les deux emails — seul le corps central diffère selon le type.
import { carrierName, trackingUrl } from './carriers'
import { emailImg } from './email-from'

const MODEL_NAMES: Record<string, string> = { kouna: 'Le Kouna', kami: 'Le Kami', nafibe: 'Le Nafibe' }

export type StatusEmailKind = 'payment' | 'shipped'

export type StatusEmailData = {
  reference: string
  firstName: string
  lang: string
  carrier: string | null
  trackingNumber: string | null
  pieces: { model: string; image_url: string; display_num: number }[]
  baseUrl: string
}

// ── Blocs réutilisables ──

function header(eyebrow: string, reference: string) {
  return `
  <tr><td style="background:#043672;padding:36px 40px;text-align:center">
    <p style="margin:0 0 12px;font-size:10px;letter-spacing:5px;text-transform:uppercase;color:#d4aa6a">${eyebrow}</p>
    <h1 style="margin:0;font-family:Georgia,serif;font-size:28px;font-weight:300;color:#fff;letter-spacing:3px">Maison Locht</h1>
    <p style="margin:8px 0 0;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.35)">${reference}</p>
  </td></tr>`
}

function greeting(title: string, body: string) {
  return `
  <tr><td style="padding:36px 40px 8px">
    <p style="margin:0;font-family:Georgia,serif;font-size:23px;font-weight:300;font-style:italic;color:#043672">${title}</p>
    <p style="margin:14px 0 0;font-size:14px;line-height:1.9;color:#5a5a6a">${body}</p>
  </td></tr>`
}

function piecesBlock(pieces: StatusEmailData['pieces'], isFr: boolean, baseUrl: string) {
  if (pieces.length === 0) return ''
  return `
  <tr><td style="padding:0 40px 28px">
    <p style="margin:0 0 14px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#b8965a">${isFr ? 'Votre pièce' : 'Your piece'}</p>
    <table cellpadding="0" cellspacing="0"><tr>
      ${pieces.map(p => `
        <td style="padding-right:16px;vertical-align:top;text-align:center">
          <img src="${emailImg(p.image_url, baseUrl)}" width="100" height="100" alt="${MODEL_NAMES[p.model] ?? p.model}"
               style="display:block;width:100px;height:100px;object-fit:cover;border:1px solid rgba(4,54,114,0.12)" />
          <p style="margin:7px 0 0;font-family:Georgia,serif;font-size:13px;font-weight:300;color:#043672;font-style:italic">${MODEL_NAMES[p.model] ?? p.model}</p>
          <p style="margin:3px 0 0;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#b8965a">N°${String(p.display_num).padStart(2, '00')}</p>
        </td>`).join('')}
    </tr></table>
  </td></tr>`
}

function cta(href: string, label: string) {
  return `
  <tr><td style="padding:4px 40px 44px;text-align:center">
    <a href="${href}"
       style="display:inline-block;background:#043672;color:#fff;font-size:11px;letter-spacing:3px;text-transform:uppercase;padding:18px 48px;text-decoration:none">
      ${label} &rarr;
    </a>
  </td></tr>`
}

function footer(isFr: boolean) {
  return `
  <tr><td style="padding:24px 40px;background:#021f45;text-align:center">
    <p style="margin:0;font-size:9px;color:rgba(255,255,255,0.4);letter-spacing:2px;text-transform:uppercase">
      ${isFr ? 'Pièce unique · ni reprise ni échange · ajustements possibles sur demande' : 'One-of-a-kind · no returns or exchanges · adjustments available on request'}
    </p>
  </td></tr>`
}

function document_(lang: string, inner: string) {
  return `
<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ede8df;font-family:Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="background:#faf7f2;border:1px solid rgba(4,54,114,0.08);max-width:580px;width:100%">
${inner}
</table>
</td></tr>
</table>
</body>
</html>`
}

// ── Corps spécifiques ──

function paymentBody(d: StatusEmailData, isFr: boolean) {
  const hasPieces = d.pieces.length > 0
  return [
    header(isFr ? 'Paiement confirmé' : 'Payment confirmed', d.reference),
    greeting(
      isFr ? `${d.firstName}, votre paiement est bien reçu.` : `${d.firstName}, your payment has been received.`,
      isFr
        ? `Votre pièce est désormais entre nos mains — cousue et vérifiée à la main, elle sera préparée avec tout le soin qu'elle mérite.`
        : `Your piece is now in our hands — hand-sewn and inspected, it will be prepared with the greatest care.`,
    ),
    piecesBlock(d.pieces, isFr, d.baseUrl),
    `
  <tr><td style="padding:${hasPieces ? '0' : '8px'} 40px 28px">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-left:4px solid #b8965a;background:#f0ebe0">
      <tr><td style="padding:20px 24px">
        <p style="margin:0 0 8px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#b8965a">${isFr ? 'Prochaine étape' : 'What happens next'}</p>
        <p style="margin:0;font-size:14px;color:#1a1a2e;line-height:1.8">${isFr
          ? 'Vous recevrez un email avec votre numéro de suivi dès que votre pièce sera expédiée.'
          : 'You will receive an email with your tracking number as soon as your piece ships.'}</p>
      </td></tr>
    </table>
  </td></tr>`,
    cta(`${d.baseUrl}/commande/${d.reference}`, isFr ? 'Suivre ma commande' : 'Track my order'),
    footer(isFr),
  ].join('')
}

function shippedBody(d: StatusEmailData, isFr: boolean) {
  const trkUrl = trackingUrl(d.carrier, d.trackingNumber)
  const trackingSection = d.trackingNumber ? `
  <tr><td style="padding:0 40px 28px">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#043672">
      <tr><td style="padding:28px 32px">
        <p style="margin:0 0 6px;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#d4aa6a">${isFr ? 'Numéro de suivi' : 'Tracking number'}</p>
        ${carrierName(d.carrier) ? `<p style="margin:0 0 12px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.45)">${carrierName(d.carrier)}</p>` : ''}
        <p style="margin:0 0 22px;font-family:Courier,monospace;font-size:22px;color:#fff;letter-spacing:3px;font-weight:600">${d.trackingNumber}</p>
        ${trkUrl ? `
        <a href="${trkUrl}"
           style="display:inline-block;background:#d4aa6a;color:#021f45;font-size:11px;letter-spacing:3px;text-transform:uppercase;padding:15px 36px;text-decoration:none;font-weight:600">
          ${isFr ? 'Suivre mon colis' : 'Track my parcel'} &rarr;
        </a>` : ''}
      </td></tr>
    </table>
  </td></tr>` : `
  <tr><td style="padding:0 40px 28px">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-left:4px solid #b8965a;background:#f0ebe0">
      <tr><td style="padding:20px 24px">
        <p style="margin:0;font-size:14px;color:#1a1a2e;line-height:1.8">${isFr
          ? 'Votre colis est en chemin. Le numéro de suivi sera disponible prochainement.'
          : 'Your parcel is on its way. The tracking number will be available soon.'}</p>
      </td></tr>
    </table>
  </td></tr>`

  return [
    header(isFr ? 'Votre pièce arrive' : 'Your piece is on its way', d.reference),
    greeting(
      isFr ? `${d.firstName}, votre pièce est en route.` : `${d.firstName}, your piece is on its way.`,
      isFr
        ? `Elle quitte nos mains pour rejoindre les vôtres. Voici tout ce qu’il vous faut pour suivre son arrivée.`
        : 'It leaves our hands to reach yours. Here is everything you need to track its arrival.',
    ),
    piecesBlock(d.pieces, isFr, d.baseUrl),
    trackingSection,
    cta(`${d.baseUrl}/commande/${d.reference}`, isFr ? 'Voir ma commande' : 'View my order'),
    footer(isFr),
  ].join('')
}

// ── API publique ──

export function statusEmailSubject(kind: StatusEmailKind, firstName: string, isFr: boolean) {
  if (kind === 'payment') {
    return isFr
      ? `${firstName}, votre paiement est confirmé · Maison Locht`
      : `${firstName}, your payment is confirmed · Maison Locht`
  }
  return isFr
    ? `${firstName}, votre pièce est en route · Maison Locht`
    : `${firstName}, your piece is on its way · Maison Locht`
}

export function buildStatusEmail(kind: StatusEmailKind, data: StatusEmailData) {
  const isFr = data.lang === 'fr'
  const inner = kind === 'payment' ? paymentBody(data, isFr) : shippedBody(data, isFr)
  return document_(data.lang, inner)
}
