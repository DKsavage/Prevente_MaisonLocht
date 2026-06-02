import Link from 'next/link'
import { createAuthClient } from '@/lib/supabase-auth'
import { createServerClient } from '@/lib/supabase-server'
import AdminShell from '@/components/admin/AdminShell'
import AutoRefresh from '@/components/AutoRefresh'
import QuickAction from '@/components/admin/QuickAction'
import { timeAgo } from '@/lib/time'

export const dynamic = 'force-dynamic'

type O = {
  reference: string; status: string; price_total: number; first_name: string; last_name: string
  bag_name: string; created_at: string; country: string | null
}

const isToday = (d: string) => new Date(d).toDateString() === new Date().toDateString()
const daysAgo = (d: string) => (Date.now() - new Date(d).getTime()) / 86400000

export default async function AdminHomePage() {
  const auth = await createAuthClient()
  const { data: { user } } = await auth.auth.getUser()

  const supabase = createServerClient()
  // Requêtes en parallèle + colonnes ciblées (pas select('*')) → plus rapide
  const [ordersRes, piecesRes] = await Promise.all([
    supabase.from('orders').select('reference, status, price_total, first_name, last_name, country, created_at').order('created_at', { ascending: false }),
    supabase.from('pieces').select('status'),
  ])
  const ordersData = ordersRes.data
  const piecesData = piecesRes.data

  const orders = (ordersData ?? []) as O[]
  const pieces = piecesData ?? []

  const paidStatuses = ['payment_received', 'confirmed', 'shipped']
  const stats = {
    today: orders.filter(o => isToday(o.created_at)).length,
    toShip: orders.filter(o => o.status === 'confirmed').length,
    pending: orders.filter(o => o.status === 'pending').length,
    late: orders.filter(o => o.status === 'pending' && daysAgo(o.created_at) > 3).length,
    revenue: orders.filter(o => paidStatuses.includes(o.status)).reduce((s, o) => s + Number(o.price_total), 0),
    available: pieces.filter(p => p.status === 'available').length,
    total: pieces.length,
  }
  const recent = orders.slice(0, 6)

  return (
    <AdminShell email={user?.email}>
      <AutoRefresh seconds={30} />
      <div className="flex flex-col gap-8">
        <h1 className="font-display text-[32px] font-light text-[#043672]">Accueil</h1>

        {/* Alertes */}
        {(stats.late > 0 || stats.toShip > 0) && (
          <div className="flex flex-col sm:flex-row gap-3">
            {stats.late > 0 && (
              <Link href="/admin/commandes" className="flex-1 flex items-center gap-3 px-5 py-4 bg-red-50 border border-red-200 hover:border-red-400 transition-colors">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-[13px] text-red-700">{stats.late} paiement{stats.late > 1 ? 's' : ''} en retard (+3 jours)</span>
              </Link>
            )}
            {stats.toShip > 0 && (
              <Link href="/admin/commandes" className="flex-1 flex items-center gap-3 px-5 py-4 bg-[#b8965a]/08 border border-[#b8965a]/30 hover:border-[#b8965a] transition-colors">
                <span className="w-2 h-2 rounded-full bg-[#b8965a]" />
                <span className="text-[13px] text-[#9a7a3a]">{stats.toShip} commande{stats.toShip > 1 ? 's' : ''} à expédier</span>
              </Link>
            )}
          </div>
        )}

        {/* Cartes résumé */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card label="Commandes aujourd'hui" value={String(stats.today)} />
          <Card label="En attente paiement" value={String(stats.pending)} accent={stats.pending > 0} />
          <Card label="Revenus confirmés" value={`${stats.revenue}`} unit="CAD" />
          <Card label="Pièces disponibles" value={`${stats.available}`} unit={`/ ${stats.total}`} />
        </div>

        {/* Commandes récentes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-label text-[9px] text-[#b8965a] tracking-[4px]">Commandes récentes</h2>
            <Link href="/admin/commandes" className="text-label text-[8px] text-[#7a7a8a] hover:text-[#043672] tracking-[2px] transition-colors">
              Tout voir →
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-[13px] text-[#7a7a8a] font-light border border-dashed border-[#043672]/15 py-10 text-center">
              Aucune commande pour le moment.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {recent.map(o => (
                <div key={o.reference} className="flex items-center gap-3 px-4 py-3 bg-[#faf7f2] border border-[#043672]/10 hover:border-[#b8965a]/40 transition-colors">
                  <Link href="/admin/commandes" className="flex items-center gap-4 flex-1 min-w-0">
                    <span className="font-mono text-[11px] text-[#043672] w-[120px] flex-shrink-0">{o.reference}</span>
                    <span className="text-[13px] text-[#1a1a2e] flex-1 truncate">{o.first_name} {o.last_name}</span>
                    <span className="hidden sm:block text-[11px] text-[#7a7a8a] tabular-nums flex-shrink-0">{timeAgo(o.created_at)}</span>
                    <span className="hidden md:block text-[12px] text-[#043672] flex-shrink-0">{o.price_total} CAD</span>
                    <StatusPill status={o.status} />
                  </Link>
                  <QuickAction reference={o.reference} status={o.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  )
}

function Card({ label, value, unit, accent }: { label: string; value: string; unit?: string; accent?: boolean }) {
  return (
    <div className={`p-5 border ${accent ? 'border-[#b8965a]/40 bg-[#b8965a]/05' : 'border-[#043672]/10 bg-[#faf7f2]'}`}>
      <p className="text-label text-[10px] text-[#7a7a8a] tracking-[2px] mb-2">{label}</p>
      <p className="font-display text-[28px] font-light text-[#043672] leading-none">
        {value} {unit && <span className="text-[13px] text-[#7a7a8a]">{unit}</span>}
      </p>
    </div>
  )
}

const STATUS_FR: Record<string, { l: string; pill: string }> = {
  pending:          { l: 'En attente',    pill: 'bg-[#b8965a]/15 text-[#9a7a3a] border-[#b8965a]/30' },
  payment_received: { l: 'Paiement reçu', pill: 'bg-blue-50 text-blue-700 border-blue-200' },
  confirmed:        { l: 'Confirmée',     pill: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  shipped:          { l: 'Expédiée',      pill: 'bg-[#043672]/10 text-[#043672] border-[#043672]/20' },
  cancelled:        { l: 'Annulée',       pill: 'bg-red-50 text-red-600 border-red-200' },
}
function StatusPill({ status }: { status: string }) {
  const s = STATUS_FR[status] ?? { l: status, pill: 'bg-[#7a7a8a]/10 text-[#7a7a8a] border-[#7a7a8a]/20' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] tracking-[0.5px] border ${s.pill}`}>
      {s.l}
    </span>
  )
}
