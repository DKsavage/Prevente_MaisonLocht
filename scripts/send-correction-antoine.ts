/**
 * Script one-time — envoie l'email de correction à Antoine Galant.
 * Contourne RESEND_TEST_EMAIL pour envoyer au vrai email du client.
 *
 * Usage : npx tsx scripts/send-correction-antoine.ts
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { buildConfirmationEmail } from '../lib/email-confirmation'

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://prevente.maisonlocht.com').replace(/\/$/, '')
const FROM     = 'Maison Locht <ml@maisonlocht.com>'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)
const resend = new Resend((process.env.RESEND_API_KEY ?? '').replace(/\s/g, ''))

const MODEL_NAMES: Record<string, string> = { kouna: 'Le Kouna', kami: 'Le Kami', nafibe: 'Le Nafibe' }
const PRICES: Record<string, number>      = { kouna: 285, kami: 328, nafibe: 395 }

async function main() {
  // Antoine Galand — LOCHT-2026-008
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('reference', 'LOCHT-2026-008')

  if (error) { console.error('Erreur Supabase :', error); process.exit(1) }
  if (!orders || orders.length === 0) {
    console.log('Aucune commande trouvée pour Antoine Galant.')
    process.exit(0)
  }

  for (const order of orders) {
    console.log(`Commande trouvée : ${order.reference} | ${order.first_name} ${order.last_name} | ${order.email} | ${order.status}`)

    // Récupérer les pièces
    const { data: pieces } = await supabase
      .from('pieces')
      .select('model, image_url, display_num')
      .eq('order_ref', order.reference)

    const piecesData = (pieces ?? []).map((p: { model: string; image_url: string; display_num: number }) => ({
      modelName: MODEL_NAMES[p.model] ?? p.model,
      pieceNum: p.display_num,
      price: PRICES[p.model] ?? 0,
      src: p.image_url,
    }))

    const html = buildConfirmationEmail({
      data: {
        firstName:    order.first_name,
        bagName:      order.bag_name,
        quantity:     order.quantity,
        priceTotal:   order.price_total,
        lang:         order.lang,
        pieces:       piecesData,
        address:      order.address,
        city:         order.city,
        province:     order.province,
        postalCode:   order.postal_code,
        country:      order.country,
        interacAnswer: order.interac_answer ?? undefined,
        errorCorrection: true,  // ← banderole de correction
      },
      reference: order.reference,
      baseUrl:   BASE_URL,
    })

    const subject = order.lang === 'fr'
      ? `Maison Locht — Correction · Votre commande ${order.reference}`
      : `Maison Locht — Correction · Your order ${order.reference}`

    // Envoi direct au vrai email (pas de RESEND_TEST_EMAIL)
    try {
      await resend.emails.send({ from: FROM, to: order.email, subject, html })
      console.log(`✓ Email de correction envoyé → ${order.email}`)
    } catch (err) {
      console.error(`✗ Échec :`, err)
    }
  }
}

main()
