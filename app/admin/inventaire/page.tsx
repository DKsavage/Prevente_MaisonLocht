import { createAuthClient } from '@/lib/supabase-auth'
import { createServerClient } from '@/lib/supabase-server'
import AdminShell from '@/components/admin/AdminShell'
import InventoryGrid, { type InvPiece } from '@/components/admin/InventoryGrid'

export const dynamic = 'force-dynamic'

export default async function AdminInventoryPage() {
  const auth = await createAuthClient()
  const { data: { user } } = await auth.auth.getUser()

  const supabase = createServerClient()
  // Requêtes en parallèle → plus rapide
  const [piecesRes, ordersRes] = await Promise.all([
    supabase.from('pieces')
      .select('id, model, image_url, status, order_ref, sort_order, display_num')
      .order('model', { ascending: true })
      .order('display_num', { ascending: true, nullsFirst: false })
      .order('sort_order', { ascending: true }),
    supabase.from('orders').select('reference, status'),
  ])
  const pieces = piecesRes.data
  const orders = ordersRes.data
  const orderStatus: Record<string, string> = {}
  ;(orders ?? []).forEach(o => { orderStatus[o.reference] = o.status })

  const list = (pieces ?? []).map(p => ({
    ...p,
    orderPending: p.order_ref ? orderStatus[p.order_ref] === 'pending' : false,
  })) as InvPiece[]

  return (
    <AdminShell email={user?.email}>
      <div className="flex flex-col gap-6">
        <h1 className="font-display text-[32px] font-light text-[#043672]">Inventaire</h1>
        <InventoryGrid pieces={list} />
      </div>
    </AdminShell>
  )
}
