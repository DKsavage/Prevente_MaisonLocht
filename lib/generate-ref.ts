import { createServerClient } from './supabase-server'

export async function generateReference(): Promise<string> {
  const supabase = createServerClient()
  const year = new Date().getFullYear()

  const { count } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .like('reference', `ML-${year}-%`)

  const num = String((count ?? 0) + 1).padStart(3, '0')
  return `LOCHT-${year}-${num}`
}
