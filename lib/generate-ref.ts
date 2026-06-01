import { createServerClient } from './supabase-server'

// Génère LOCHT-YYYY-NNN basé sur le plus grand numéro existant de l'année.
// Robuste aux préfixes mixtes (ancien ML-) et aux trous de numérotation.
export async function generateReference(): Promise<string> {
  const supabase = createServerClient()
  const year = new Date().getFullYear()

  const { data } = await supabase
    .from('orders')
    .select('reference')
    .like('reference', `%-${year}-%`)

  let max = 0
  for (const row of data ?? []) {
    const m = (row.reference as string).match(/-(\d+)$/)
    if (m) max = Math.max(max, parseInt(m[1], 10))
  }

  const num = String(max + 1).padStart(3, '0')
  return `LOCHT-${year}-${num}`
}
