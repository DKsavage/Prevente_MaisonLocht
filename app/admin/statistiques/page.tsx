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
  // Borne les visites aux 30 derniers jours (la pré-vente tient dans cette fenêtre) → requête rapide même à grande échelle
  const since30 = new Date(now - 30 * dayMs).toISOString()

  // Requêtes en parallèle (pas séquentielles) → page plus rapide
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
  const pageViews = v.length
  const visitors = new Set(v.map(x => x.session).filter(Boolean)).size
  const viewsToday = v.filter(x => isToday(x.created_at)).length
  const visitorsToday = new Set(v.filter(x => isToday(x.created_at)).map(x => x.session)).size
  const last7Views = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(now - (6 - i) * dayMs)
    return { label: day.toLocaleDateString('fr-CA', { weekday: 'short' }),
      count: v.filter(x => new Date(x.created_at).toDateString() === day.toDateString()).length }
  })
  const maxView = Math.max(1, ...last7Views.map(d => d.count))

  // ── Ventes ──
  const paid = o.filter(x => ['payment_received', 'confirmed', 'shipped'].includes(x.status))
  const revenue = paid.reduce((s, x) => s + Number(x.price_total), 0)
  const pendingRevenue = o.filter(x => x.status === 'pending').reduce((s, x) => s + Number(x.price_total), 0)
  const conversion = visitors > 0 ? ((o.length / visitors) * 100).toFixed(1) : '0'

  // Revenus / jour (7 jours, commandes payées)
  const last7Rev = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(now - (6 - i) * dayMs)
    return { label: day.toLocaleDateString('fr-CA', { weekday: 'short' }),
      count: paid.filter(x => new Date(x.created_at).toDateString() === day.toDateString()).reduce((s, x) => s + Number(x.price_total), 0) }
  })
  const maxRev = Math.max(1, ...last7Rev.map(d => d.count))

  // ── Modèles les plus vendus (pièces sold/reserved liées à une commande) ──
  const soldByModel: Record<string, number> = {}
  p.filter(x => x.order_ref).forEach(x => { soldByModel[x.model] = (soldByModel[x.model] ?? 0) + 1 })
  const modelRanking = ['kouna', 'kami', 'nafibe']
    .map(m => ({ model: m, name: MODEL_NAMES[m] ?? m, count: soldByModel[m] ?? 0 }))
    .sort((a, b) => b.count - a.count)
  const maxModel = Math.max(1, ...modelRanking.map(m => m.count))

  // ── Stock bas (≤2 dispo) ──
  const availByModel: Record<string, number> = {}
  p.filter(x => x.status === 'available').forEach(x => { availByModel[x.model] = (availByModel[x.model] ?? 0) + 1 })
  const lowStock = ['kouna', 'kami', 'nafibe']
    .map(m => ({ name: MODEL_NAMES[m] ?? m, n: availByModel[m] ?? 0 }))
    .filter(m => m.n <= 2)

  // ── Pays ──
  const byCountry: Record<string, number> = {}
  o.forEach(x => { const c = x.country ?? '—'; byCountry[c] = (byCountry[c] ?? 0) + 1 })

  // ── Pages les plus vues ──
  const byPath: Record<string, number> = {}
  v.forEach(x => { const path = x.path || '/'; byPath[path] = (byPath[path] ?? 0) + 1 })
  const topPages = Object.entries(byPath).sort((a, b) => b[1] - a[1]).slice(0, 6)

  // ── Sources de trafic (referrer → domaine) ──
  const refDomain = (r: string) => {
    if (!r) return 'Direct'
    try { return new URL(r).hostname.replace(/^www\./, '') } catch { return 'Direct' }
  }
  const bySource: Record<string, number> = {}
  v.forEach(x => { const d = refDomain(x.referrer || ''); bySource[d] = (bySource[d] ?? 0) + 1 })
  const topSources = Object.entries(bySource).sort((a, b) => b[1] - a[1]).slice(0, 6)

  // ── Réponses "Qu'est-ce qui t'a attiré" ──
  const whyResponses = o.filter(x => x.why_locht && x.why_locht.trim()).map(x => x.why_locht as string)

  // ── Inventaire ──
  const sold = p.filter(x => x.status === 'sold')
  const inv = {
    total: p.length, available: p.filter(x => x.status === 'available').length,
    reserved: p.filter(x => x.status === 'reserved').length, sold: sold.length,
    soldOnline: sold.filter(x => x.order_ref).length, soldShop: sold.filter(x => !x.order_ref).length,
  }

  // ── Entonnoir ──
  const funnel = [
    { label: 'Visiteurs', n: visitors },
    { label: 'Commandes', n: o.length },
    { label: 'Payées', n: paid.length },
  ]
  const maxFunnel = Math.max(1, ...funnel.map(f => f.n))

  return (
    <AdminShell email={user?.email}>
      <AutoRefresh seconds={45} />
      <div className="flex flex-col gap-9">
        <h1 className="font-display text-[32px] font-light text-[#043672]">Statistiques</h1>

        {/* Alerte stock bas */}
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

        {/* Trafic */}
        <Section title="Trafic">
          <Card label="Visiteurs (total)" value={String(visitors)} accent />
          <Card label="Pages vues (total)" value={String(pageViews)} />
          <Card label="Visiteurs aujourd'hui" value={String(visitorsToday)} />
          <Card label="Pages vues aujourd'hui" value={String(viewsToday)} />
        </Section>

        {/* Graphiques 7 jours */}
        <div className="grid md:grid-cols-2 gap-8">
          <Chart title="Pages vues — 7 jours" data={last7Views} max={maxView} />
          <Chart title="Revenus — 7 jours (CAD)" data={last7Rev} max={maxRev} suffix="" />
        </div>

        {/* Entonnoir + conversion */}
        <div className="grid md:grid-cols-[1fr_200px] gap-4 items-stretch">
          <div className="bg-[#faf7f2] border border-[#043672]/08 p-5">
            <SectionTitle title="Entonnoir de conversion" />
            <div className="flex flex-col gap-2.5">
              {funnel.map(f => (
                <div key={f.label} className="flex items-center gap-3">
                  <span className="text-[11px] text-[#043672] w-20 flex-shrink-0">{f.label}</span>
                  <div className="flex-1 h-6 bg-[#043672]/06 overflow-hidden rounded-sm">
                    <div className="h-full bg-gradient-to-r from-[#043672] to-[#0a4d9e] flex items-center justify-end px-2 rounded-sm transition-all duration-500" style={{ width: `${Math.max(8, (f.n / maxFunnel) * 100)}%` }}>
                      <span className="text-[9px] text-white tabular-nums">{f.n}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center justify-center p-5 border border-[#b8965a]/40 bg-[#b8965a]/[0.06] text-center">
            <p className="text-label text-[8px] text-[#7a7a8a] tracking-[2px] mb-2">Conversion</p>
            <p className="font-display text-[38px] font-light text-[#043672] leading-none">{conversion}<span className="text-[18px] text-[#7a7a8a]">%</span></p>
            <p className="text-label text-[7px] text-[#7a7a8a] tracking-[1px] mt-2">commandes / visiteurs</p>
          </div>
        </div>

        {/* Ventes */}
        <Section title="Ventes">
          <Card label="Commandes totales" value={String(o.length)} />
          <Card label="Revenus confirmés" value={`${revenue} CAD`} accent />
          <Card label="En attente paiement" value={`${pendingRevenue} CAD`} />
          <Card label="Panier moyen" value={`${o.length ? Math.round((revenue + pendingRevenue) / o.length) : 0} CAD`} />
        </Section>

        {/* Modèles populaires + Pays */}
        <div className="grid md:grid-cols-2 gap-8">
          <BarList title="Modèles les plus vendus" rows={modelRanking.map(m => ({ label: m.name, n: m.count }))} max={maxModel} empty="Aucune vente." />
          <BarList title="Commandes par pays" rows={Object.entries(byCountry).sort((a,b)=>b[1]-a[1]).map(([c,n]) => ({ label: c, n }))} max={Math.max(1, ...Object.values(byCountry))} empty="Aucune commande." />
        </div>

        {/* Pages vues + Sources */}
        <div className="grid md:grid-cols-2 gap-8">
          <BarList title="Pages les plus vues" rows={topPages.map(([path, n]) => ({ label: path, n }))} max={Math.max(1, ...topPages.map(t => t[1]))} empty="Aucune visite." mono />
          <BarList title="Sources de trafic" rows={topSources.map(([src, n]) => ({ label: src, n }))} max={Math.max(1, ...topSources.map(t => t[1]))} empty="Aucune visite." />
        </div>

        {/* Inventaire */}
        <Section title="Inventaire">
          <Card label="Disponibles" value={String(inv.available)} />
          <Card label="Réservées" value={String(inv.reserved)} />
          <Card label="Vendues en ligne" value={String(inv.soldOnline)} />
          <Card label="Vendues boutique" value={String(inv.soldShop)} />
        </Section>

        {/* Réponses clientes */}
        <div>
          <SectionTitle title={`Ce qui les a attirées (${whyResponses.length})`} />
          {whyResponses.length === 0 ? (
            <p className="text-[13px] text-[#7a7a8a] font-light">Aucune réponse pour l&apos;instant.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {whyResponses.map((r, i) => (
                <div key={i} className="bg-[#faf7f2] border-l-2 border-[#b8965a] px-4 py-2.5">
                  <span className="text-[12px] text-[#1a1a2e] font-light italic">&laquo; {r} &raquo;</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Note */}
        <div className="bg-[#f0ebe0] p-5 flex gap-4">
          <span className="text-[#b8965a] text-lg flex-shrink-0">✦</span>
          <div>
            <p className="text-label text-[9px] text-[#043672] tracking-[2px] mb-1.5">À propos des données</p>
            <p className="text-[12px] text-[#7a7a8a] font-light leading-relaxed">
              Trafic compté par le site (anonyme, sans cookie tiers). Géographie détaillée et appareils : <strong>Vercel → Analytics</strong>. Mise à jour auto toutes les 45s.
            </p>
          </div>
        </div>
      </div>
    </AdminShell>
  )
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="w-1 h-3.5 bg-[#b8965a]/70 flex-shrink-0" />
      <span className="text-label text-[9px] text-[#043672] tracking-[4px]">{title}</span>
      <span className="flex-1 h-px bg-[#043672]/08" />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <SectionTitle title={title} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">{children}</div>
    </div>
  )
}

function Card({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`relative p-4 md:p-5 border overflow-hidden transition-all duration-300 hover:-translate-y-0.5 ${
      accent ? 'border-[#b8965a]/40 bg-[#b8965a]/[0.06]' : 'border-[#043672]/10 bg-[#faf7f2] hover:border-[#043672]/25'
    }`}>
      {accent && <span className="absolute top-0 left-0 right-0 h-0.5 bg-[#b8965a]" />}
      <p className="text-label text-[7px] md:text-[8px] text-[#7a7a8a] tracking-[2px] mb-2 leading-tight">{label}</p>
      <p className="font-display text-[22px] md:text-[26px] font-light text-[#043672] leading-none">{value}</p>
    </div>
  )
}

function Chart({ title, data, max, suffix = '' }: { title: string; data: { label: string; count: number }[]; max: number; suffix?: string }) {
  return (
    <div className="bg-[#faf7f2] border border-[#043672]/08 p-5">
      <SectionTitle title={title} />
      <div className="flex items-end gap-1.5 md:gap-2 h-32">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
            <span className="text-[9px] text-[#7a7a8a] group-hover:text-[#043672] transition-colors tabular-nums">{d.count}{suffix}</span>
            <div className="w-full bg-[#043672]/06 relative rounded-t-sm overflow-hidden" style={{ height: '84px' }}>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#043672] to-[#b8965a] rounded-t-sm transition-all duration-500 group-hover:opacity-90"
                style={{ height: `${Math.max(2, (d.count / max) * 100)}%` }} />
            </div>
            <span className="text-label text-[7px] text-[#7a7a8a] tracking-[1px]">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BarList({ title, rows, max, empty, mono }: { title: string; rows: { label: string; n: number }[]; max: number; empty: string; mono?: boolean }) {
  return (
    <div className="bg-[#faf7f2] border border-[#043672]/08 p-5">
      <SectionTitle title={title} />
      {rows.length === 0 || rows.every(r => r.n === 0) ? (
        <p className="text-[12px] text-[#7a7a8a] font-light py-3">{empty}</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className={`text-[11px] text-[#043672] w-20 md:w-28 truncate flex-shrink-0 ${mono ? 'font-mono text-[9px]' : ''}`}>{r.label}</span>
              <div className="flex-1 h-2.5 bg-[#043672]/06 overflow-hidden rounded-sm">
                <div className="h-full bg-gradient-to-r from-[#b8965a] to-[#d4aa6a] rounded-sm transition-all duration-500" style={{ width: `${Math.max(3, (r.n / max) * 100)}%` }} />
              </div>
              <span className="text-[11px] text-[#7a7a8a] w-7 text-right tabular-nums flex-shrink-0">{r.n}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
