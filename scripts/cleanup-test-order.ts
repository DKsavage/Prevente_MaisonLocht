/**
 * Nettoyage d'une commande de TEST.
 * Libère les pièces réservées (→ available) puis supprime la commande.
 *
 * ⚠️ Ne touche QUE la référence passée. Ne touche jamais les ventes boutique
 *    (sold + order_ref=null), conformément aux règles métier.
 *
 * Usage : npx tsx scripts/cleanup-test-order.ts LOCHT-2026-0XX
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const ref = process.argv[2]
if (!ref) { console.error('Référence requise. Ex: npx tsx scripts/cleanup-test-order.ts LOCHT-2026-099'); process.exit(1) }
if (!/^LOCHT-\d{4}-\d{3}$/.test(ref)) { console.error('Format référence invalide:', ref); process.exit(1) }

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function main() {
  // Sécurité : confirme que la commande existe avant de toucher quoi que ce soit
  const { data: order } = await supabase.from('orders').select('reference, first_name, email, status').eq('reference', ref).single()
  if (!order) { console.error('Aucune commande', ref); process.exit(1) }
  console.log(`Cible: ${order.reference} | ${order.first_name} | ${order.email} | ${order.status}`)

  // 1. Libère les pièces liées à CETTE commande uniquement
  const { data: released, error: pErr } = await supabase.from('pieces')
    .update({ status: 'available', order_ref: null, reserved_at: null })
    .eq('order_ref', ref)
    .select('id')
  if (pErr) { console.error('Erreur libération pièces:', pErr); process.exit(1) }
  console.log(`✓ ${released?.length ?? 0} pièce(s) remise(s) en "available"`)

  // 2. Supprime la commande
  const { error: oErr } = await supabase.from('orders').delete().eq('reference', ref)
  if (oErr) { console.error('Erreur suppression commande:', oErr); process.exit(1) }
  console.log(`✓ Commande ${ref} supprimée`)
  console.log('Nettoyage terminé.')
}

main()
