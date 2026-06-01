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
    .select('*')
    .order('created_at', { ascending: false })

  // Statistiques rapides en tête
  const list = (orders ?? []) as Order[]
  const stats = {
    total: list.length,
    pending: list.filter(o => o.status === 'pending').length,
    revenue: list
      .filter(o => ['payment_received', 'confirmed', 'shipped'].includes(o.status))
      .reduce((s, o) => s + Number(o.price_total), 0),
  }

  return (
    <AdminShell email={user?.email}>
      <div className="flex flex-col gap-6">
        <div className="flex items-end justify-between">
          <h1 className="font-display text-[32px] font-light text-[#043672]">Commandes</h1>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Commandes" value={String(stats.total)} />
          <StatCard label="En attente paiement" value={String(stats.pending)} accent />
          <StatCard label="Revenus confirmés" value={`${stats.revenue} CAD`} />
        </div>

        <OrdersTable initialOrders={list} />
      </div>
    </AdminShell>
  )
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`p-5 border ${accent ? 'border-[#b8965a]/40 bg-[#b8965a]/05' : 'border-[#043672]/10 bg-[#faf7f2]'}`}>
      <p className="text-label text-[8px] text-[#7a7a8a] tracking-[2px] mb-2">{label}</p>
      <p className="font-display text-[26px] font-light text-[#043672]">{value}</p>
    </div>
  )
}
