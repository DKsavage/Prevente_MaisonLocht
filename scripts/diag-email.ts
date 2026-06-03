/**
 * Script diagnostic — surface la VRAIE erreur Resend.
 *
 * Le SDK resend@6 renvoie { data, error } et ne throw PAS sur erreur API.
 * Ce script imprime le retour complet pour identifier la cause racine
 * de "Échec email" sur le dashboard.
 *
 * Usage : npx tsx scripts/diag-email.ts [reference] [destinataire]
 *   - reference   : commande à rejouer (défaut : la plus récente)
 *   - destinataire : force le "to" (défaut : RESEND_TEST_EMAIL ou email commande)
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { buildConfirmationEmail } from '../lib/email-confirmation'
import { pieceNum } from '../lib/models'

const refArg = process.argv[2]
const toArg = process.argv[3]

function mask(v: string | undefined) {
  if (!v) return 'UNSET'
  return `SET (len=${v.length}, head=${v.slice(0, 4)}…)`
}

const RAW_KEY = process.env.RESEND_API_KEY ?? ''
const KEY = RAW_KEY.replace(/\s/g, '')
const FROM = 'Maison Locht <ml@maisonlocht.com>'

const MODEL_NAMES: Record<string, string> = { kouna: 'Le Kouna', kami: 'Le Kami', nafibe: 'Le Nafibe' }
const PRICES: Record<string, number> = { kouna: 285, kami: 328, nafibe: 395 }

async function main() {
  console.log('=== ENV ===')
  console.log('RESEND_API_KEY      :', mask(RAW_KEY), RAW_KEY !== KEY ? '(espaces nettoyés!)' : '')
  console.log('RESEND_TEST_EMAIL   :', process.env.RESEND_TEST_EMAIL ?? 'UNSET')
  console.log('NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL ?? 'UNSET')
  console.log('SUPABASE_URL        :', mask(process.env.NEXT_PUBLIC_SUPABASE_URL))
  console.log('SERVICE_ROLE_KEY    :', mask(process.env.SUPABASE_SERVICE_ROLE_KEY))
  console.log('FROM                :', FROM)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const resend = new Resend(KEY)

  // ── Récupère une commande réelle ──
  let query = supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(1)
  if (refArg) query = supabase.from('orders').select('*').eq('reference', refArg).limit(1)
  const { data: orders, error: oErr } = await query
  if (oErr) { console.error('Erreur Supabase orders:', oErr); process.exit(1) }
  if (!orders || orders.length === 0) { console.error('Aucune commande trouvée.'); process.exit(1) }
  const order = orders[0]
  console.log('\n=== COMMANDE ===')
  console.log(`${order.reference} | ${order.first_name} | ${order.email} | ${order.country} | ${order.status}`)

  const { data: pieces } = await supabase
    .from('pieces').select('id, model, image_url, display_num').eq('order_ref', order.reference)
  console.log('Pièces liées:', (pieces ?? []).length)

  const piecesData = (pieces ?? []).map((p: { id: string; model: string; image_url: string; display_num: number }) => ({
    modelName: MODEL_NAMES[p.model] ?? p.model,
    pieceNum: pieceNum(p),
    price: PRICES[p.model] ?? 0,
    src: p.image_url,
  }))

  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://prevente.maisonlocht.com')
    .replace(/\s/g, '').replace(/\/$/, '')
  const to = toArg || (process.env.RESEND_TEST_EMAIL ?? '').replace(/\s/g, '') || order.email
  console.log('Destinataire (to):', to)
  console.log('baseUrl          :', baseUrl)

  const html = buildConfirmationEmail({
    data: {
      firstName: order.first_name, bagName: order.bag_name, quantity: order.quantity,
      priceTotal: order.price_total, lang: order.lang, pieces: piecesData,
      address: order.address, city: order.city, province: order.province,
      postalCode: order.postal_code, country: order.country,
      interacAnswer: order.interac_answer ?? undefined,
    },
    reference: order.reference, baseUrl,
  })

  console.log('\n=== ENVOI RESEND ===')
  try {
    const result = await resend.emails.send({
      from: FROM,
      to,
      subject: `Maison Locht — Diagnostic ${order.reference}`,
      html,
    })
    console.log('Retour complet:', JSON.stringify(result, null, 2))
    if (result.error) {
      console.error('\n❌ ERREUR API RESEND (non-throw):', result.error)
    } else {
      console.log('\n✅ Email accepté par Resend. id =', result.data?.id)
    }
  } catch (err) {
    console.error('\n❌ EXCEPTION lancée par le SDK:', err)
  }
}

main()
