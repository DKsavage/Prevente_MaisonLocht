import { createAuthClient } from '@/lib/supabase-auth'
import { createServerClient } from '@/lib/supabase-server'
import AdminShell from '@/components/admin/AdminShell'
import InventoryGrid, { type InvPiece } from '@/components/admin/InventoryGrid'

export const dynamic = 'force-dynamic'

export default async function AdminInventoryPage() {
  const auth = await createAuthClient()
  const { data: { user } } = await auth.auth.getUser()

  const supabase = createServerClient()
  const { data: pieces } = await supabase
    .from('pieces')
    .select('id, model, image_url, status, order_ref, sort_order')
    .order('model', { ascending: true })
    .order('sort_order', { ascending: true })

  const list = (pieces ?? []) as InvPiece[]

  return (
    <AdminShell email={user?.email}>
      <div className="flex flex-col gap-6">
        <h1 className="font-display text-[32px] font-light text-[#043672]">Inventaire</h1>
        <InventoryGrid pieces={list} />
      </div>
    </AdminShell>
  )
}
