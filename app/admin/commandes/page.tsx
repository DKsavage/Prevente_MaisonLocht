import { createAuthClient } from '@/lib/supabase-auth'
import { createServerClient } from '@/lib/supabase-server'
import AdminShell from '@/components/admin/AdminShell'
import OrdersTable, { type Order } from '@/components/admin/OrdersTable'

export const dynamic = 'force-dynamic'

export default async function AdminOrdersPage() {
  const auth = await createAuthClient()
  const { data: { user } } = await auth.auth.getUser()

  const supabase = createServerClient()
  const { data: orders } = await supabase
    .from('orders')
    .select('reference, status, bag_name, quantity, price_total, first_name, last_name, email, phone, address, city, province, postal_code, country, lang, why_locht, notes_admin, tracking_number, carrier, interac_answer, created_at')
    .order('created_at', { ascending: false })

  const list = (orders ?? []) as Order[]

  return (
    <AdminShell email={user?.email}>
      <div className="flex flex-col gap-6">
        <h1 className="font-display text-[32px] font-light text-[#043672]">Commandes</h1>
        <OrdersTable initialOrders={list} />
      </div>
    </AdminShell>
  )
}
