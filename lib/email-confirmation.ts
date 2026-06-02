import { getPaymentMethod, paymentInstructions } from './payment'

export type ConfirmationData = {
  firstName: string; bagName: string; quantity: number; priceTotal: number; lang: string
  pieces?: { modelName: string; pieceNum: number; price: number; src: string }[]
  address?: string; city?: string; province?: string; postalCode?: string; country?: string
  interacAnswer?: string
  errorCorrection?: boolean
  whyLocht?: string
}

// Email de confirmation de commande (template de marque)
export function buildConfirmationEmail({ data, reference, baseUrl }: {
  data: ConfirmationData
  reference: string
  baseUrl: string
}) {
  const isFr = data.lang === 'fr'
  const pieces = data.pieces ?? []
  const pay = paymentInstructions(getPaymentMethod(data.country ?? ''), reference, isFr ? 'fr' : 'en', data.interacAnswer)

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
        <tr><td style="background:#043672;padding:40px;text-align:center">
          <p style="margin:0 0 14px;font-size:10px;letter-spacing:5px;text-transform:uppercase;color:#d4aa6a">${isFr ? 'Commande confirmée' : 'Order confirmed'}</p>
          <h1 style="margin:0;font-family:Georgia,serif;font-size:30px;font-weight:300;color:#fff;letter-spacing:3px">Maison Locht</h1>
          <p style="margin:8px 0 0;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.4)">LOCHT 01 &middot; Les Cernes</p>
        </td></tr>
        <tr><td style="padding:36px 40px 20px">
          <p style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:300;font-style:italic;color:#043672">${isFr ? `Merci, ${data.firstName}.` : `Thank you, ${data.firstName}.`}</p>
          <p style="margin:12px 0 0;font-size:13px;line-height:1.8;color:#7a7a8a">${isFr
            ? 'Votre pièce vous attend. Voici le récapitulatif de votre commande.'
            : 'Your piece awaits. Here is your order summary.'}</p>
        </td></tr>
        ${data.whyLocht ? `
        <tr><td style="padding:0 40px 16px">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-left:3px solid #b8965a;background:#f9f6f1">
            <tr><td style="padding:16px 20px">
              <p style="margin:0 0 6px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#b8965a">
                ${isFr ? 'Vous nous avez confié' : 'You told us'}
              </p>
              <p style="margin:0 0 10px;font-family:Georgia,serif;font-size:14px;font-weight:300;font-style:italic;color:#043672;line-height:1.7">
                &laquo; ${data.whyLocht} &raquo;
              </p>
              <p style="margin:0;font-size:12px;color:#7a7a8a;line-height:1.6">
                ${isFr ? 'Nous l\'avons gardé en tête en préparant votre pièce.' : 'We kept it in mind while preparing your piece.'}
              </p>
            </td></tr>
          </table>
        </td></tr>` : ''}
        ${data.errorCorrection ? `
        <tr><td style="padding:0 40px 12px">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#b8965a">
            <tr><td style="padding:16px 22px">
              <p style="margin:0;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#fff">${isFr ? '— Correction importante —' : '— Important correction —'}</p>
              <p style="margin:8px 0 0;font-size:13px;color:#fff;line-height:1.7">${isFr
                ? 'Nous vous avons envoyé un email par erreur. Votre commande est bien enregistrée — mais votre paiement n\'a pas encore été reçu. Veuillez suivre les instructions ci-dessous pour finaliser votre achat.'
                : 'We sent you an email by mistake. Your order is registered — but your payment has not been received yet. Please follow the instructions below to complete your purchase.'}</p>
            </td></tr>
          </table>
        </td></tr>` : ''}
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
        <tr><td style="padding:28px 40px;background:#043672;text-align:center">
          <p style="margin:0 0 8px;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:rgba(255,255,255,0.4)">${isFr ? 'Votre référence' : 'Your reference'}</p>
          <p style="margin:0;font-family:Georgia,serif;font-size:30px;font-weight:300;color:#fff;letter-spacing:4px">${reference}</p>
        </td></tr>
        <tr><td style="background:#043672;padding:10px 40px 6px;text-align:center">
          <p style="margin:0;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#d4aa6a">${isFr ? '— Action requise —' : '— Action required —'}</p>
          <p style="margin:4px 0 6px;font-family:Georgia,serif;font-size:18px;font-weight:300;color:#fff">${pay.title}</p>
        </td></tr>
        <tr><td style="padding:24px 40px 20px;background:#021f45">
          ${pay.lines.map(l => `<p style="margin:0 0 10px;font-size:14px;color:rgba(255,255,255,0.9);line-height:1.8">${l}</p>`).join('')}
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:14px 0 0;border-top:1px solid rgba(255,255,255,0.1)">
            ${pay.fields.map(f => `
              <tr>
                <td style="font-size:11px;color:rgba(255,255,255,0.5);padding:6px 0;letter-spacing:1px;text-transform:uppercase">${f.label}</td>
                <td style="font-size:14px;color:#d4aa6a;text-align:right;padding:6px 0;font-weight:600;letter-spacing:1px">${f.value}</td>
              </tr>`).join('')}
          </table>
          <p style="margin:16px 0 0;font-size:12px;color:rgba(255,255,255,0.45);line-height:1.7;text-align:center">${isFr
            ? 'Votre commande sera confirmée dès réception du paiement.'
            : 'Your order will be confirmed upon receipt of payment.'}</p>
        </td></tr>
        <tr><td style="padding:24px 40px;border-bottom:1px solid rgba(4,54,114,0.06)">
          <p style="margin:0 0 10px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#b8965a">${isFr ? 'Livraison' : 'Delivery'}</p>
          <p style="margin:0;font-size:13px;line-height:1.7;color:#043672">${fullAddress}</p>
        </td></tr>
        <tr><td style="padding:28px 40px 16px;text-align:center">
          <a href="${baseUrl}/commande/${reference}"
            style="display:inline-block;background:#043672;color:#fff;font-size:10px;letter-spacing:3px;text-transform:uppercase;padding:15px 32px;text-decoration:none">
            ${isFr ? 'Suivre ma commande' : 'Track my order'} &rarr;
          </a>
        </td></tr>
        <tr><td style="padding:0 40px 24px;text-align:center">
          <p style="margin:0;font-size:10px;color:#7a7a8a;line-height:1.7">${isFr
            ? 'Pièce unique &middot; ni reprise ni échange. Des ajustements sur le sac restent possibles sur demande.'
            : 'One-of-a-kind &middot; no returns or exchanges. Adjustments to the bag remain available on request.'}</p>
        </td></tr>
        <tr><td style="padding:24px 40px;background:#021f45;text-align:center">
          <p style="margin:0;font-size:9px;color:rgba(255,255,255,0.4);letter-spacing:2px;text-transform:uppercase">${isFr ? 'Pièces uniques, jamais reproduites' : 'One-of-a-kind pieces, never reproduced'}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
