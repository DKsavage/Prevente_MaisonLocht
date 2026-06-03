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

  // Récapitulatif global
  const total     = list.length
  const available = list.filter(p => p.status === 'available').length
  const reserved  = list.filter(p => p.status === 'reserved').length
  const sold      = list.filter(p => p.status === 'sold').length
  const pct = (n: number) => total > 0 ? (n / total) * 100 : 0

  return (
    <AdminShell email={user?.email}>
      <div className="flex flex-col gap-8">

        {/* ── En-tête éditorial ── */}
        <div className="flex items-end justify-between border-b border-[#043672]/08 pb-5">
          <div>
            <p className="text-label text-[9px] tracking-[4px] text-[#b8965a] uppercase mb-2">
              Maison Locht · Pièces uniques
            </p>
            <h1 className="font-display text-[38px] md:text-[48px] font-light text-[#043672] leading-none">
              Inventaire
            </h1>
          </div>
          <div className="text-right hidden sm:block">
            <p className="font-display text-[20px] font-light text-[#043672]/55 leading-none">{total}</p>
            <p className="text-label text-[9px] tracking-[3px] text-[#7a7a8a] mt-1.5">pièces au total</p>
          </div>
        </div>

        {/* ── Barre récap globale ── */}
        {total > 0 && (
          <div className="flex flex-col gap-2.5">
            <div className="flex h-[6px] w-full overflow-hidden bg-[#043672]/06 gap-px">
              {sold > 0      && <div className="bg-[#043672] transition-all duration-700" style={{ width: `${pct(sold)}%` }} />}
              {reserved > 0  && <div className="bg-[#b8965a] transition-all duration-700" style={{ width: `${pct(reserved)}%` }} />}
              {available > 0 && <div className="bg-emerald-500/70" style={{ width: `${pct(available)}%` }} />}
            </div>
            <div className="flex items-center gap-5 flex-wrap">
              {available > 0 && <Legend color="bg-emerald-500/70" label={`${available} disponible${available > 1 ? 's' : ''}`} />}
              {reserved > 0  && <Legend color="bg-[#b8965a]" label={`${reserved} réservée${reserved > 1 ? 's' : ''}`} />}
              {sold > 0      && <Legend color="bg-[#043672]" label={`${sold} vendue${sold > 1 ? 's' : ''}`} />}
            </div>
          </div>
        )}

        <InventoryGrid pieces={list} />
      </div>
    </AdminShell>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2.5 h-2.5 flex-shrink-0 ${color}`} />
      <span className="text-[10px] text-[#7a7a8a] font-light">{label}</span>
    </div>
  )
}
