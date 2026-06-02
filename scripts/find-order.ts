import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function main() {
  const { data } = await supabase
    .from('orders')
    .select('reference, first_name, last_name, email, status, country, created_at')
    .order('created_at', { ascending: false })
    .limit(20)

  console.log('\n— 20 dernières commandes —')
  data?.forEach(o => console.log(`${o.reference} | ${o.first_name} ${o.last_name} | ${o.email} | ${o.status} | ${o.country}`))
}

main()
