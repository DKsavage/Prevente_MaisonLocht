import { createAuthClient } from '@/lib/supabase-auth'
import { createServerClient } from '@/lib/supabase-server'
import AdminShell from '@/components/admin/AdminShell'
import AutoRefresh from '@/components/AutoRefresh'

export const dynamic = 'force-dynamic'

const MODEL_NAMES: Record<string, string> = { kouna: 'Le Kouna', kami: 'Le Kami', nafibe: 'Le Nafibe' }

export default async function AdminStatsPage() {
  const auth = await createAuthClient()
  const { data: { user } } = await auth.auth.getUser()

  const supabase = createServerClient()
  const now = Date.now()
  const dayMs = 86400000
  const since30 = new Date(now - 30 * dayMs).toISOString()

  const [ordersRes, piecesRes, visitsRes] = await Promise.all([
    supabase.from('orders').select('status, price_total, country, created_at, why_locht'),
    supabase.from('pieces').select('model, status, order_ref'),
    supabase.from('visits').select('session, created_at, path, referrer').gte('created_at', since30),
  ])

  const o = ordersRes.data ?? []
  const p = piecesRes.data ?? []
  const v = visitsRes.data ?? []
  const isToday = (d: string) => new Date(d).toDateString() === new Date().toDateString()

  // ── Trafic ──
  const pageViews   = v.length
  const visitors    = new Set(v.map(x => x.session).filter(Boolean)).size
  const viewsToday  = v.filter(x => isToday(x.created_at)).length
  const visitorsToday = new Set(v.filter(x => isToday(x.created_at)).map(x => x.session)).size
  const last7Views  = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(now - (6 - i) * dayMs)
    return { label: day.toLocaleDateString('fr-CA', { weekday: 'short' }),
      count: v.filter(x => new Date(x.created_at).toDateString() === day.toDateString()).length }
  })
  const maxView = Math.max(1, ...last7Views.map(d => d.count))

  // ── Ventes ──
  const paid          = o.filter(x => ['payment_received', 'confirmed', 'shipped'].includes(x.status))
  const revenue       = paid.reduce((s, x) => s + Number(x.price_total), 0)
  const pendingRevenue = o.filter(x => x.status === 'pending').reduce((s, x) => s + Number(x.price_total), 0)
  const avgBasket     = o.length ? Math.round((revenue + pendingRevenue) / o.length) : 0
  const conversion    = visitors > 0 ? ((o.length / visitors) * 100).toFixed(1) : '0'

  const last7Rev = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(now - (6 - i) * dayMs)
    return { label: day.toLocaleDateString('fr-CA', { weekday: 'short' }),
      count: paid.filter(x => new Date(x.created_at).toDateString() === day.toDateString()).reduce((s, x) => s + Number(x.price_total), 0) }
  })
  const maxRev = Math.max(1, ...last7Rev.map(d => d.count))

  // ── Modèles ──
  const soldByModel: Record<string, number> = {}
  p.filter(x => x.order_ref).forEach(x => { soldByModel[x.model] = (soldByModel[x.model] ?? 0) + 1 })
  const modelRanking = ['kouna', 'kami', 'nafibe']
    .map(m => ({ model: m, name: MODEL_NAMES[m] ?? m, count: soldByModel[m] ?? 0 }))
    .sort((a, b) => b.count - a.count)
  const maxModel = Math.max(1, ...modelRanking.map(m => m.count))

  // ── Stock bas ──
  const availByModel: Record<string, number> = {}
  p.filter(x => x.status === 'available').forEach(x => { availByModel[x.model] = (availByModel[x.model] ?? 0) + 1 })
  const lowStock = ['kouna', 'kami', 'nafibe']
    .map(m => ({ name: MODEL_NAMES[m] ?? m, n: availByModel[m] ?? 0 }))
    .filter(m => m.n <= 2)

  // ── Pays ──
  const byCountry: Record<string, number> = {}
  o.forEach(x => { const c = x.country ?? '—'; byCountry[c] = (byCountry[c] ?? 0) + 1 })

  // ── Pages ──
  const byPath: Record<string, number> = {}
  v.forEach(x => { const pg = x.path && x.path !== '' ? x.path : '/'; byPath[pg] = (byPath[pg] ?? 0) + 1 })
  const labelPath = (pg: string) => pg === '/' ? 'Accueil (/)' : pg
  const topPages  = Object.entries(byPath).sort((a, b) => b[1] - a[1]).slice(0, 6)

  // ── Sources ──
  const refDomain = (r: string) => {
    if (!r) return 'Direct'
    try { return new URL(r).hostname.replace(/^www\./, '') } catch { return 'Direct' }
  }
  const bySource  = {} as Record<string, number>
  v.forEach(x => { const d = refDomain(x.referrer || ''); bySource[d] = (bySource[d] ?? 0) + 1 })
  const topSources = Object.entries(bySource).sort((a, b) => b[1] - a[1]).slice(0, 6)

  // ── Réponses ──
  const whyResponses = o.filter(x => x.why_locht && x.why_locht.trim()).map(x => x.why_locht as string)

  // ── Inventaire ──
  const sold = p.filter(x => x.status === 'sold')
  const inv  = {
    total: p.length,
    available: p.filter(x => x.status === 'available').length,
    reserved:  p.filter(x => x.status === 'reserved').length,
    sold:      sold.length,
    soldOnline: sold.filter(x => x.order_ref).length,
    soldShop:   sold.filter(x => !x.order_ref).length,
  }

  // ── Entonnoir ──
  const funnel     = [
    { label: 'Visiteurs',  n: visitors },
    { label: 'Commandes',  n: o.length },
    { label: 'Payées',     n: paid.length },
  ]
  const maxFunnel = Math.max(1, ...funnel.map(f => f.n))

  return (
    <AdminShell email={user?.email}>
      <AutoRefresh seconds={45} />
      <div className="flex flex-col gap-10">

        <h1 className="font-display text-[32px] font-light text-[#043672]">Statistiques</h1>

        {/* Alertes stock bas */}
        {lowStock.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {lowStock.map(m => (
              <div key={m.name} className="flex items-center gap-2 px-4 py-2.5 bg-[#b8965a]/08 border border-[#b8965a]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#b8965a]" style={{ animation: 'urgency-pulse 1.8s ease-in-out infinite' }} />
                <span className="text-[12px] text-[#9a7a3a]">{m.name} : {m.n} pièce{m.n > 1 ? 's' : ''} restante{m.n > 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── TRAFIC : 2 KPI héros + 2 secondaires ── */}
        <div>
          <SectionTitle title="Trafic" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <HeroCard label="Visiteurs" value={String(visitors)} sub="30 derniers jours" />
            <HeroCard label="Pages vues" value={String(pageViews)} sub="30 derniers jours" />
            <Card label="Visiteurs aujourd'hui" value={String(visitorsToday)} />
            <Card label="Pages vues aujourd'hui" value={String(viewsToday)} />
          </div>
        </div>

        {/* ── GRAPHIQUES 7 jours ── */}
        <div className="grid md:grid-cols-2 gap-6">
          <Chart title="Pages vues — 7 jours" data={last7Views} max={maxView} />
          <Chart title="Revenus — 7 jours (CAD)" data={last7Rev} max={maxRev} />
        </div>

        {/* ── ENTONNOIR + CONVERSION ── */}
        <div className="grid md:grid-cols-[1fr_220px] gap-4 items-stretch">
          <div className="bg-[#faf7f2] border border-[#043672]/08 p-6">
            <SectionTitle title="Entonnoir de conversion" />
            <div className="flex flex-col gap-4">
              {funnel.map(f => (
                <div key={f.label} className="flex items-center gap-4">
                  <span className="text-[12px] text-[#043672] w-24 flex-shrink-0">{f.label}</span>
                  <div className="flex-1 h-7 bg-[#043672]/06 overflow-hidden rounded-sm relative">
                    <div
                      className="h-full bg-gradient-to-r from-[#043672] to-[#0a4d9e] flex items-center justify-end px-3 rounded-sm transition-all duration-700"
                      style={{ width: `${Math.max(10, (f.n / maxFunnel) * 100)}%` }}
                    >
                      <span className="text-[11px] text-white tabular-nums font-light">{f.n}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center justify-center p-6 border border-[#b8965a]/40 bg-[#b8965a]/[0.06] text-center gap-1">
            <p className="text-label text-[10px] text-[#7a7a8a] tracking-[2px]">Conversion</p>
            <p className="font-display text-[52px] font-light text-[#043672] leading-none">
              {conversion}<span className="text-[22px] text-[#7a7a8a]">%</span>
            </p>
            <p className="text-label text-[10px] text-[#7a7a8a] tracking-[1px]">commandes / visiteurs</p>
          </div>
        </div>

        {/* ── VENTES : 2 KPI héros + 2 secondaires ── */}
        <div>
          <SectionTitle title="Ventes" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <HeroCard label="Revenus confirmés" value={`${revenue}`} sub="CAD" accent />
            <HeroCard label="Commandes totales" value={String(o.length)} sub="toutes périodes" />
            <Card label="En attente paiement" value={`${pendingRevenue} CAD`} />
            <Card label="Panier moyen" value={`${avgBasket} CAD`} />
          </div>
        </div>

        {/* ── CLASSEMENTS ── */}
        <div className="grid md:grid-cols-2 gap-6">
          <BarList title="Modèles les plus vendus"
            rows={modelRanking.map(m => ({ label: m.name, n: m.count }))}
            max={maxModel} empty="Aucune vente." />
          <BarList title="Commandes par pays"
            rows={Object.entries(byCountry).sort((a,b)=>b[1]-a[1]).map(([c,n]) => ({ label: c, n }))}
            max={Math.max(1, ...Object.values(byCountry))} empty="Aucune commande." />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <BarList title="Pages les plus vues"
            rows={topPages.map(([pg, n]) => ({ label: labelPath(pg), n }))}
            max={Math.max(1, ...topPages.map(t => t[1]))} empty="Aucune visite." mono />
          <BarList title="Sources de trafic"
            rows={topSources.map(([src, n]) => ({ label: src, n }))}
            max={Math.max(1, ...topSources.map(t => t[1]))} empty="Aucune visite." />
        </div>

        {/* ── INVENTAIRE ── */}
        <div>
          <SectionTitle title="Inventaire" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <Card label="Disponibles"      value={String(inv.available)} />
            <Card label="Réservées"        value={String(inv.reserved)} />
            <Card label="Vendues en ligne" value={String(inv.soldOnline)} />
            <Card label="Vendues boutique" value={String(inv.soldShop)} />
          </div>
        </div>

        {/* ── RÉPONSES CLIENTES ── */}
        {whyResponses.length > 0 && (
          <div>
            <SectionTitle title={`Ce qui les a attirées (${whyResponses.length})`} />
            <div className="flex flex-col gap-3">
              {whyResponses.map((r, i) => (
                <div key={i} className="bg-[#faf7f2] border-l-2 border-[#b8965a] px-5 py-3.5">
                  <span className="font-display text-[16px] font-light text-[#1a1a2e] italic leading-relaxed">
                    &laquo; {r} &raquo;
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Note */}
        <div className="bg-[#f0ebe0] p-5 flex gap-4 border-t-2 border-[#043672]/06">
          <span className="text-[#b8965a] text-lg flex-shrink-0">✦</span>
          <div>
            <p className="text-label text-[10px] text-[#043672] tracking-[2px] mb-1.5">À propos des données</p>
            <p className="text-[12px] text-[#7a7a8a] font-light leading-relaxed">
              Trafic compté par le site (anonyme, sans cookie tiers). Géographie détaillée et appareils : <strong>Vercel → Analytics</strong>. Mise à jour auto toutes les 45s.
            </p>
          </div>
        </div>

      </div>
    </AdminShell>
  )
}

// ── Composants ────────────────────────────────────────────────

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="w-1 h-4 bg-[#b8965a]/70 flex-shrink-0" />
      <span className="text-label text-[10px] text-[#043672] tracking-[3px]">{title}</span>
      <span className="flex-1 h-px bg-[#043672]/08" />
    </div>
  )
}

// KPI secondaire — compact
function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 md:p-5 border border-[#043672]/10 bg-[#faf7f2] hover:border-[#043672]/25 transition-colors duration-300">
      <p className="text-label text-[10px] text-[#7a7a8a] tracking-[2px] mb-2 leading-tight">{label}</p>
      <p className="font-display text-[24px] md:text-[28px] font-light text-[#043672] leading-none">{value}</p>
    </div>
  )
}

// KPI primaire — grand chiffre Cormorant
function HeroCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`relative p-5 md:p-6 border overflow-hidden transition-colors duration-300 ${
      accent ? 'border-[#b8965a]/40 bg-[#b8965a]/[0.06]' : 'border-[#043672]/12 bg-[#faf7f2] hover:border-[#043672]/30'
    }`}>
      {accent && <span className="absolute top-0 left-0 right-0 h-0.5 bg-[#b8965a]" />}
      <p className="text-label text-[10px] text-[#7a7a8a] tracking-[2px] mb-3 leading-tight">{label}</p>
      <p className="font-display text-[36px] md:text-[44px] font-light text-[#043672] leading-none tabular-nums">{value}</p>
      {sub && <p className="text-label text-[9px] text-[#7a7a8a] tracking-[1px] mt-2">{sub}</p>}
    </div>
  )
}

// Graphique barres vertical
function Chart({ title, data, max }: { title: string; data: { label: string; count: number }[]; max: number }) {
  return (
    <div className="bg-[#faf7f2] border border-[#043672]/08 p-5">
      <SectionTitle title={title} />
      <div className="flex items-end gap-2 md:gap-3 h-44">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
            <span className="text-[10px] text-[#7a7a8a] group-hover:text-[#043672] transition-colors tabular-nums">
              {d.count}
            </span>
            <div className="w-full bg-[#043672]/06 relative rounded-t-sm overflow-hidden" style={{ height: '120px' }}>
              <div
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#043672] to-[#b8965a] rounded-t-sm transition-all duration-700 group-hover:opacity-90"
                style={{ height: `${Math.max(2, (d.count / max) * 100)}%` }}
              />
            </div>
            <span className="text-label text-[10px] text-[#7a7a8a] tracking-[0.5px]">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Liste classée avec barres horizontales
function BarList({ title, rows, max, empty, mono }: {
  title: string; rows: { label: string; n: number }[]; max: number; empty: string; mono?: boolean
}) {
  const hasData = rows.length > 0 && rows.some(r => r.n > 0)
  return (
    <div className="bg-[#faf7f2] border border-[#043672]/08 p-5">
      <SectionTitle title={title} />
      {!hasData ? (
        <p className="text-[12px] text-[#7a7a8a] font-light py-3">{empty}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((r, i) => {
            const pct = Math.round((r.n / max) * 100)
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[10px] text-[#043672]/30 w-4 flex-shrink-0 tabular-nums text-right">{i + 1}</span>
                <span className={`text-[#043672] flex-shrink-0 ${
                  mono ? 'font-mono text-[10px] w-28 md:w-36' : 'text-[12px] w-24 md:w-32'
                } truncate`}>
                  {r.label}
                </span>
                <div className="flex-1 h-4 bg-[#043672]/06 overflow-hidden rounded-sm">
                  <div
                    className="h-full bg-gradient-to-r from-[#b8965a] to-[#d4aa6a] rounded-sm transition-all duration-700"
                    style={{ width: `${Math.max(4, pct)}%` }}
                  />
                </div>
                <div className="flex items-baseline gap-1.5 flex-shrink-0 w-14 justify-end">
                  <span className="text-[12px] text-[#043672] tabular-nums">{r.n}</span>
                  <span className="text-[9px] text-[#7a7a8a]">{pct}%</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
