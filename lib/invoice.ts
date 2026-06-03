import type { Order } from '@/components/admin/OrdersTable'

type PieceItem = { id: string; model: string; display_num: number }

// LOCHT-2026-001 → F-2026-001
export function invoiceNumber(reference: string): string {
  const m = reference.match(/LOCHT-(\d{4}-\d+)$/)
  return m ? `F-${m[1]}` : `F-${reference}`
}

function esc(s: string | null | undefined): string {
  return (s ?? '—')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-CA', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

export function buildInvoiceHtml(order: Order, pieces: PieceItem[] = []): string {
  const num = invoiceNumber(order.reference)
  const date = fmtDate(order.created_at)
  const unitPrice = (Number(order.price_total) / order.quantity).toFixed(2)
  const paymentLabel = order.country === 'CA'
    ? `Virement Interac · ${order.reference}`
    : `Virement bancaire IBAN · ${order.reference}`

  const pieceList = pieces.length > 0
    ? pieces.map(p => `Pièce N°${String(p.display_num).padStart(2, '0')}`).join(', ')
    : '—'

  const addrLines = [
    esc(order.address),
    `${esc(order.city)}${order.province ? `, ${esc(order.province)}` : ''} ${esc(order.postal_code)}`,
    esc(order.country),
  ].filter(Boolean).join('<br>')

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Facture ${esc(num)}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;1,300&family=DM+Sans:wght@300;400&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

@page { size: A4; margin: 15mm 18mm; }

body {
  font-family: 'DM Sans', sans-serif;
  font-weight: 300;
  color: #1a1a2e;
  background: #fff;
}

@media screen {
  body { padding: 28px 36px; max-width: 780px; margin: 0 auto; }
}

/* Bouton visible uniquement à l'écran */
.btn-print {
  display: block;
  margin-bottom: 28px;
  padding: 10px 24px;
  background: #043672;
  color: #fff;
  border: none;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  font-size: 9pt;
  letter-spacing: 2px;
  text-transform: uppercase;
}
@media print { .btn-print { display: none; } }

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 14pt;
  border-bottom: 1px solid #1a1a2e;
  margin-bottom: 28pt;
}
.brand {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 300;
  font-style: italic;
  font-size: 20pt;
  color: #043672;
  letter-spacing: 2px;
}
.brand-sub { font-size: 8pt; color: #7a7a8a; margin-top: 4pt; letter-spacing: 1px; }
.invoice-meta { text-align: right; }
.invoice-label { font-size: 7.5pt; letter-spacing: 3px; text-transform: uppercase; color: #7a7a8a; display: block; margin-bottom: 4pt; }
.invoice-number { font-family: 'JetBrains Mono', monospace; font-size: 13pt; color: #1a1a2e; }
.invoice-date { font-size: 8.5pt; color: #7a7a8a; margin-top: 4pt; }

/* Parties */
.parties { display: grid; grid-template-columns: 1fr 1fr; gap: 20pt; margin-bottom: 26pt; }
.party-label { font-size: 7.5pt; letter-spacing: 3px; text-transform: uppercase; color: #b8965a; display: block; margin-bottom: 6pt; }
.party-name { font-size: 10.5pt; font-weight: 400; margin-bottom: 3pt; }
.party-detail { font-size: 9pt; color: #7a7a8a; line-height: 1.7; }

/* Tableau */
table { width: 100%; border-collapse: collapse; margin-bottom: 18pt; }
thead th {
  font-size: 7.5pt; letter-spacing: 2px; text-transform: uppercase;
  color: #7a7a8a; padding: 5pt 0; border-bottom: 1px solid #1a1a2e;
  text-align: left; font-weight: 400;
}
thead th:last-child { text-align: right; }
tbody td { padding: 10pt 0; border-bottom: 1px solid #e0dbd4; font-size: 10pt; line-height: 1.5; vertical-align: top; }
tbody td:last-child { text-align: right; }
.article-name { font-weight: 400; }
.article-sub { font-size: 8pt; color: #7a7a8a; margin-top: 2pt; }

/* Total */
.total-wrap { display: flex; justify-content: flex-end; margin-bottom: 24pt; }
.total-inner { border-top: 1.5px solid #1a1a2e; padding-top: 9pt; min-width: 180pt; }
.total-row { display: flex; justify-content: space-between; font-size: 12pt; font-weight: 400; }
.total-sub { font-size: 7.5pt; color: #7a7a8a; margin-top: 5pt; }

/* Paiement */
.payment { background: #f5f1eb; padding: 9pt 12pt; margin-bottom: 22pt; }
.payment-label { font-size: 7.5pt; letter-spacing: 2px; text-transform: uppercase; color: #7a7a8a; display: block; margin-bottom: 3pt; }
.payment-value { font-size: 9.5pt; }

/* Conditions */
.conditions { border-left: 2px solid #b8965a; padding-left: 11pt; margin-bottom: 22pt; }
.conditions-title { font-size: 7.5pt; letter-spacing: 2px; text-transform: uppercase; color: #b8965a; margin-bottom: 5pt; }
.conditions ul { list-style: none; }
.conditions li { font-size: 8.5pt; color: #7a7a8a; line-height: 1.8; }
.conditions li::before { content: '— '; color: #b8965a; }

/* Footer */
.footer {
  border-top: 1px solid #e0dbd4;
  padding-top: 10pt;
  display: flex;
  justify-content: space-between;
  align-items: center;
  page-break-inside: avoid;
}
.footer-brand { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 10pt; color: #043672; }
.footer-url { font-size: 7.5pt; color: #7a7a8a; letter-spacing: 1px; }
</style>
</head>
<body>

<button class="btn-print" onclick="window.print()">Imprimer / Enregistrer PDF</button>

<div class="header">
  <div>
    <p class="brand">Maison Locht</p>
    <p class="brand-sub">Collection LOCHT 01 — Les Cernes</p>
  </div>
  <div class="invoice-meta">
    <span class="invoice-label">Facture</span>
    <span class="invoice-number">${esc(num)}</span>
    <p class="invoice-date">${esc(date)}</p>
  </div>
</div>

<div class="parties">
  <div>
    <span class="party-label">De</span>
    <p class="party-name">Maison Locht</p>
    <p class="party-detail">ml@maisonlocht.com<br>maisonlocht.com</p>
  </div>
  <div>
    <span class="party-label">Pour</span>
    <p class="party-name">${esc(order.first_name)} ${esc(order.last_name)}</p>
    <p class="party-detail">
      ${esc(order.email)}<br>
      ${addrLines}
    </p>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th>Article</th>
      <th>Pièces</th>
      <th>Qté</th>
      <th>Prix unit.</th>
      <th>Total</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        <p class="article-name">${esc(order.bag_name)}</p>
        <p class="article-sub">Collection LOCHT 01 — Les Cernes · Pièce unique</p>
      </td>
      <td><span class="article-sub">${esc(pieceList)}</span></td>
      <td>${order.quantity}</td>
      <td>${unitPrice} CAD</td>
      <td style="font-weight:400">${order.price_total} CAD</td>
    </tr>
  </tbody>
</table>

<div class="total-wrap">
  <div class="total-inner">
    <div class="total-row">
      <span>Total</span>
      <span>${order.price_total} CAD</span>
    </div>
    <p class="total-sub">Taxes incluses si applicables · Mode : ${esc(paymentLabel)}</p>
  </div>
</div>

<div class="conditions">
  <p class="conditions-title">Conditions de vente</p>
  <ul>
    <li>Vente finale — aucun remboursement.</li>
    <li>Chaque pièce est unique et ne sera jamais reproduite.</li>
    <li>Ajustements assurés à vie par Maison Locht.</li>
    <li>Maximum 2 pièces par commande.</li>
  </ul>
</div>

<div class="footer">
  <span class="footer-brand">Maison Locht</span>
  <span class="footer-url">prevente.maisonlocht.com</span>
</div>

</body>
</html>`
}
