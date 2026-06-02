import Link from 'next/link'
import { createAuthClient } from '@/lib/supabase-auth'
import { createServerClient } from '@/lib/supabase-server'
import AdminShell from '@/components/admin/AdminShell'
import AutoRefresh from '@/components/AutoRefresh'
import QuickAction from '@/components/admin/QuickAction'
import { timeAgo } from '@/lib/time'

export const dynamic = 'force-dynamic'

type O = {
  reference: string; status: string; price_total: number
  first_name: string; last_name: string; bag_name: string
  created_at: string; country: string | null
}

const isToday = (d: string) => new Date(d).toDateString() === new Date().toDateString()
const daysAgo = (d: string) => (Date.now() - new Date(d).getTime()) / 86400000

function fmtRevenue(n: number) {
  return n.toLocaleString('fr-CA', { maximumFractionDigits: 0 })
}

const STATUS_DOT: Record<string, string> = {
  pending: 'bg-[#b8965a]', payment_received: 'bg-blue-500',
  confirmed: 'bg-emerald-500', shipped: 'bg-[#043672]', cancelled: 'bg-red-400',
}
const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente', payment_received: 'Paiement reçu',
  confirmed: 'Confirmée', shipped: 'Expédiée', cancelled: 'Annulée',
}
const STATUS_LEFT: Record<string, string> = {
  pending: '#b8965a', payment_received: '#3b82f6',
  confirmed: '#10b981', shipped: '#043672', cancelled: '#ef4444',
}

export default async function AdminHomePage() {
  const auth = await createAuthClient()
  const { data: { user } } = await auth.auth.getUser()

  const supabase = createServerClient()
  const [ordersRes, piecesRes] = await Promise.all([
    supabase.from('orders')
      .select('reference, status, price_total, first_name, last_name, bag_name, country, created_at')
      .order('created_at', { ascending: false }),
    supabase.from('pieces').select('status'),
  ])

  const orders = (ordersRes.data ?? []) as O[]
  const pieces = piecesRes.data ?? []

  const paidStatuses = ['payment_received', 'confirmed', 'shipped']
  const paidCount    = orders.filter(o => paidStatuses.includes(o.status)).length
  const revenue      = orders.filter(o => paidStatuses.includes(o.status)).reduce((s, o) => s + Number(o.price_total), 0)

  const pieceAvailable = pieces.filter(p => p.status === 'available').length
  const pieceReserved  = pieces.filter(p => p.status === 'reserved').length
  const pieceSold      = pieces.filter(p => p.status === 'sold').length
  const pieceTotal     = pieces.length

  const stats = {
    today:   orders.filter(o => isToday(o.created_at)).length,
    toShip:  orders.filter(o => o.status === 'confirmed').length,
    pending: orders.filter(o => o.status === 'pending').length,
    late:    orders.filter(o => o.status === 'pending' && daysAgo(o.created_at) > 3).length,
  }

  const recent = orders.slice(0, 8)

  // Date éditoriale — serveur
  const now      = new Date()
  const weekday  = now.toLocaleDateString('fr-CA', { weekday: 'long' })
  const dayMonth = now.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })
  const year     = now.getFullYear()

  return (
    <AdminShell email={user?.email}>
      <AutoRefresh seconds={30} />
      <div className="flex flex-col gap-7">

        {/* ── En-tête éditorial ── */}
        <div className="flex items-end justify-between border-b border-[#043672]/08 pb-5">
          <div>
            <p className="text-label text-[9px] tracking-[4px] text-[#b8965a] uppercase mb-2">
              Maison Locht · Tableau de bord
            </p>
            <h1 className="font-display text-[38px] md:text-[48px] font-light text-[#043672] leading-none capitalize">
              {weekday}
            </h1>
          </div>
          <div className="text-right hidden sm:block">
            <p className="font-display text-[20px] font-light text-[#043672]/55 leading-none">{dayMonth}</p>
            <p className="text-label text-[9px] tracking-[3px] text-[#7a7a8a] mt-1.5">{year}</p>
          </div>
        </div>

        {/* ── Alertes urgentes ── */}
        {(stats.late > 0 || stats.toShip > 0) && (
          <div className="flex flex-col sm:flex-row gap-2">
            {stats.late > 0 && (
              <Link href="/admin/commandes"
                className="flex-1 flex items-center gap-3 px-4 py-3.5 bg-red-50/60 border-l-[3px] border-l-red-500 border border-red-200/70 hover:bg-red-50 hover:border-red-300 transition-all duration-200 group">
                <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 animate-pulse" />
                <span className="text-[12px] text-red-700 flex-1 font-light">
                  <strong className="font-medium">{stats.late}</strong> paiement{stats.late > 1 ? 's' : ''} en retard · plus de 3 jours
                </span>
                <span className="text-label text-[9px] text-red-400 tracking-[1px] group-hover:text-red-600 transition-colors whitespace-nowrap">
                  VOIR →
                </span>
              </Link>
            )}
            {stats.toShip > 0 && (
              <Link href="/admin/commandes"
                className="flex-1 flex items-center gap-3 px-4 py-3.5 bg-[#043672]/03 border-l-[3px] border-l-[#043672] border border-[#043672]/10 hover:bg-[#043672]/06 transition-all duration-200 group">
                <span className="w-2 h-2 rounded-full bg-[#043672] flex-shrink-0" />
                <span className="text-[12px] text-[#043672] flex-1 font-light">
                  <strong className="font-medium">{stats.toShip}</strong> commande{stats.toShip > 1 ? 's' : ''} confirmée{stats.toShip > 1 ? 's' : ''} · prête{stats.toShip > 1 ? 's' : ''} à expédier
                </span>
                <span className="text-label text-[9px] text-[#043672]/35 tracking-[1px] group-hover:text-[#043672]/70 transition-colors whitespace-nowrap">
                  VOIR →
                </span>
              </Link>
            )}
          </div>
        )}

        {/* ── KPIs — layout asymétrique ── */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_210px] gap-3">

          {/* Revenus — carte héro (élément mémorable) */}
          <div className="bg-[#043672] px-7 py-8 flex flex-col gap-4">
            <p className="text-label text-[9px] tracking-[4px] text-[#d4aa6a] uppercase">
              Revenus confirmés
            </p>
            <div className="flex items-baseline gap-3">
              <span className="font-display text-[56px] md:text-[64px] font-light text-white leading-none tracking-[-1px]">
                {fmtRevenue(revenue)}
              </span>
              <span className="text-label text-[11px] tracking-[2px] text-white/35">CAD</span>
            </div>
            <p className="text-[11px] text-white/35 font-light">
              {paidCount} commande{paidCount !== 1 ? 's' : ''} payée{paidCount !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Mini stats — colonne */}
          <div className="grid grid-cols-3 md:grid-cols-1 gap-2 md:gap-3">
            <MiniStat label="Aujourd'hui" value={stats.today} />
            <MiniStat label="En attente" value={stats.pending} urgent={stats.pending > 0} />
            <MiniStat label="À expédier" value={stats.toShip} action={stats.toShip > 0} />
          </div>
        </div>

        {/* ── Inventaire — barre de progression ── */}
        {pieceTotal > 0 && (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <p className="text-label text-[9px] tracking-[4px] text-[#b8965a] uppercase">
                Inventaire · {pieceTotal} pièces
              </p>
              <Link href="/admin/inventaire"
                className="text-label text-[9px] text-[#7a7a8a] hover:text-[#043672] tracking-[2px] transition-colors">
                Gérer →
              </Link>
            </div>
            {/* Barre segmentée */}
            <div className="flex h-[6px] w-full overflow-hidden bg-[#043672]/06 gap-px">
              {pieceSold > 0 && (
                <div className="bg-[#043672] transition-all duration-700"
                  style={{ width: `${(pieceSold / pieceTotal) * 100}%` }} />
              )}
              {pieceReserved > 0 && (
                <div className="bg-[#b8965a] transition-all duration-700"
                  style={{ width: `${(pieceReserved / pieceTotal) * 100}%` }} />
              )}
              {pieceAvailable > 0 && (
                <div className="bg-[#043672]/18"
                  style={{ width: `${(pieceAvailable / pieceTotal) * 100}%` }} />
              )}
            </div>
            <div className="flex items-center gap-5 flex-wrap">
              {pieceSold > 0 && <Legend color="bg-[#043672]" label={`${pieceSold} vendue${pieceSold > 1 ? 's' : ''}`} />}
              {pieceReserved > 0 && <Legend color="bg-[#b8965a]" label={`${pieceReserved} réservée${pieceReserved > 1 ? 's' : ''}`} />}
              {pieceAvailable > 0 && <Legend color="bg-[#043672]/30" label={`${pieceAvailable} disponible${pieceAvailable > 1 ? 's' : ''}`} />}
            </div>
          </div>
        )}

        {/* ── Commandes récentes ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-label text-[9px] tracking-[4px] text-[#b8965a] uppercase">
              Commandes récentes
            </p>
            <Link href="/admin/commandes"
              className="text-label text-[9px] text-[#7a7a8a] hover:text-[#043672] tracking-[2px] transition-colors">
              Tout voir →
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="text-center py-12 text-[13px] text-[#7a7a8a] font-light border border-dashed border-[#043672]/12">
              Aucune commande pour le moment.
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {recent.map(o => {
                const isLate   = o.status === 'pending' && daysAgo(o.created_at) > 3
                const bagShort = (o.bag_name ?? '').replace(/Le /g, '').replace(/, /g, ' · ')
                const refShort = `#${o.reference.split('-').pop()}`
                return (
                  <div key={o.reference}
                    className="flex items-center gap-0 px-4 py-3 bg-[#faf7f2] border-l-[3px] border-r border-t border-b border-r-[#043672]/07 border-t-[#043672]/07 border-b-[#043672]/07 hover:bg-[#f5f1eb] transition-all duration-200"
                    style={{ borderLeftColor: isLate ? '#ef4444' : STATUS_LEFT[o.status] ?? '#043672' }}
                  >
                    <Link href="/admin/commandes" className="flex items-center flex-1 min-w-0 overflow-hidden">

                      {/* Indicateur retard */}
                      <span className={`flex-shrink-0 mr-2 ${isLate ? 'w-2' : 'w-0'}`}>
                        {isLate && <span className="block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                      </span>

                      {/* Référence — largeur fixe */}
                      <span className="font-mono text-[10px] text-[#043672]/45 flex-shrink-0 mr-3">
                        <span className="sm:hidden w-[28px] inline-block">{refShort}</span>
                        <span className="hidden sm:inline-block w-[114px] truncate">{o.reference}</span>
                      </span>

                      {/* Nom — prend tout l'espace restant */}
                      <span className="text-[13px] font-light text-[#1a1a2e] flex-1 min-w-0 truncate mr-3">
                        {o.first_name} {o.last_name}
                      </span>

                      {/* Modèle sac — largeur fixe, truncate */}
                      <span className="hidden md:block w-[96px] flex-shrink-0 text-[9px] tracking-[1px] uppercase text-[#9a7a3a] text-right truncate mr-3">
                        {bagShort}
                      </span>

                      {/* Statut — largeur fixe (accommodate "Paiement reçu" = plus long) */}
                      <span className="hidden sm:flex items-center gap-1.5 w-[122px] flex-shrink-0 mr-3">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[o.status] ?? 'bg-[#7a7a8a]'}`} />
                        <span className="text-[10px] text-[#7a7a8a] truncate">{STATUS_LABEL[o.status] ?? o.status}</span>
                      </span>

                      {/* Montant — largeur fixe, aligné à droite */}
                      <span className="hidden sm:block w-[76px] flex-shrink-0 text-[12px] text-[#043672] font-medium text-right mr-3">
                        {o.price_total} CAD
                      </span>

                      {/* Temps — largeur fixe */}
                      <span className="hidden lg:block w-[60px] flex-shrink-0 text-[10px] text-[#7a7a8a] text-right">
                        {timeAgo(o.created_at)}
                      </span>
                    </Link>

                    <div className="flex-shrink-0 ml-3">
                      <QuickAction reference={o.reference} status={o.status} firstName={o.first_name} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </AdminShell>
  )
}

// ── Composants locaux ──

function MiniStat({ label, value, urgent, action }: {
  label: string; value: number; urgent?: boolean; action?: boolean
}) {
  return (
    <div className={`px-4 py-4 flex flex-col gap-1.5 border transition-all duration-200 ${
      urgent ? 'bg-[#b8965a]/06 border-[#b8965a]/22' :
      action ? 'bg-[#043672]/03 border-[#043672]/10' :
               'bg-[#faf7f2] border-[#043672]/08'
    }`}>
      <p className={`text-label text-[9px] tracking-[2px] uppercase ${
        urgent ? 'text-[#9a7a3a]' : action ? 'text-[#043672]/55' : 'text-[#7a7a8a]'
      }`}>
        {label}
      </p>
      <p className={`font-display text-[30px] font-light leading-none ${
        urgent || action ? 'text-[#043672]' : 'text-[#043672]'
      }`}>
        {value}
      </p>
    </div>
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
