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
const STATUS_PILL: Record<string, string> = {
  pending:          'bg-[#b8965a]/10 text-[#9a7a3a] border-[#b8965a]/25',
  payment_received: 'bg-blue-50 text-blue-700 border-blue-200',
  confirmed:        'bg-emerald-50 text-emerald-700 border-emerald-200',
  shipped:          'bg-[#043672]/08 text-[#043672] border-[#043672]/20',
  cancelled:        'bg-red-50 text-red-500 border-red-200',
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
            <p className="text-[12px] text-white/60 font-light">
              {paidCount} commande{paidCount !== 1 ? 's' : ''} payée{paidCount !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Mini stats — colonne */}
          <div className="grid grid-cols-3 md:grid-cols-1 gap-2 md:gap-3">
            <MiniStat label="Aujourd'hui" sub="nouvelles commandes" value={stats.today} />
            <MiniStat label="En attente" sub="paiement non reçu" value={stats.pending} urgent={stats.pending > 0} />
            <MiniStat label="À expédier" sub="commandes confirmées" value={stats.toShip} action={stats.toShip > 0} />
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
                className="text-label text-[9px] tracking-[2px] text-[#043672] border border-[#043672]/20 px-3 py-1.5 hover:bg-[#043672] hover:text-white transition-all duration-200">
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
              className="text-label text-[9px] tracking-[2px] text-[#043672] border border-[#043672]/20 px-3 py-1.5 hover:bg-[#043672] hover:text-white transition-all duration-200">
              Tout voir →
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="text-center py-12 text-[13px] text-[#7a7a8a] font-light border border-dashed border-[#043672]/12">
              Aucune commande pour le moment.
            </div>
          ) : (
            <div className="flex flex-col border border-[#043672]/08">
              {recent.map((o, i) => {
                const isLate = o.status === 'pending' && daysAgo(o.created_at) > 3
                const idx    = o.reference.split('-').pop() ?? String(i + 1)
                const pill   = STATUS_PILL[o.status] ?? 'bg-[#7a7a8a]/08 text-[#7a7a8a] border-[#7a7a8a]/20'
                return (
                  <div key={o.reference}
                    className={`group relative flex items-center gap-4 px-4 py-3.5 bg-[#faf7f2] hover:bg-[#f5f1eb] transition-all duration-200 ${i > 0 ? 'border-t border-[#043672]/06' : ''}`}
                  >
                    {/* Accent gauche — apparaît au survol (révèle le statut) */}
                    <span
                      className="absolute left-0 top-0 bottom-0 w-[3px] opacity-60 group-hover:opacity-100 transition-opacity duration-200"
                      style={{ background: isLate ? '#ef4444' : STATUS_LEFT[o.status] ?? '#043672' }}
                    />

                    {/* Index éditorial — anchor numéroté */}
                    <span className="font-display text-[22px] font-light text-[#043672]/25 group-hover:text-[#b8965a]/70 tabular-nums w-[34px] text-center flex-shrink-0 transition-colors duration-200 leading-none">
                      {idx}
                    </span>

                    {/* Zone cliquable — nom + méta */}
                    <Link href="/admin/commandes" className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {isLate && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />}
                        <span className="text-[14px] font-light text-[#1a1a2e] truncate">{o.first_name} {o.last_name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="font-mono text-[9px] text-[#043672]/35 tracking-[0.5px]">{o.reference}</span>
                        <span className="text-[9px] text-[#043672]/15">·</span>
                        <span className="text-[10px] text-[#7a7a8a]/70">{timeAgo(o.created_at)}</span>
                      </div>
                    </Link>

                    {/* Badge statut — soigné */}
                    <span className={`hidden sm:inline-flex items-center text-label text-[8px] tracking-[1.5px] uppercase px-2.5 py-1 border flex-shrink-0 ${pill}`}>
                      {STATUS_LABEL[o.status] ?? o.status}
                    </span>

                    {/* Montant — éditorial Cormorant */}
                    <span className="flex items-baseline gap-1 flex-shrink-0 w-[78px] justify-end">
                      <span className="font-display text-[19px] font-light text-[#043672] tabular-nums leading-none">{o.price_total}</span>
                      <span className="text-[9px] text-[#7a7a8a] tracking-[1px]">CAD</span>
                    </span>

                    {/* Action rapide */}
                    <div className="flex-shrink-0">
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

function MiniStat({ label, sub, value, urgent, action }: {
  label: string; sub: string; value: number; urgent?: boolean; action?: boolean
}) {
  return (
    <div className={`px-4 py-4 flex flex-col gap-1 border transition-all duration-200 ${
      urgent ? 'bg-[#b8965a]/06 border-[#b8965a]/22' :
      action ? 'bg-[#043672]/03 border-[#043672]/10' :
               'bg-[#faf7f2] border-[#043672]/08'
    }`}>
      <p className={`text-label text-[9px] tracking-[2px] uppercase ${
        urgent ? 'text-[#9a7a3a]' : action ? 'text-[#043672]/55' : 'text-[#7a7a8a]'
      }`}>
        {label}
      </p>
      <p className="font-display text-[30px] font-light leading-none text-[#043672]">
        {value}
      </p>
      <p className="text-[10px] text-[#7a7a8a] font-light leading-tight">{sub}</p>
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
