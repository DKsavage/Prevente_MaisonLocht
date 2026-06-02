import { createAuthClient } from '@/lib/supabase-auth'
import { createServerClient } from '@/lib/supabase-server'
import AdminShell from '@/components/admin/AdminShell'
import AutoRefresh from '@/components/AutoRefresh'

export const dynamic = 'force-dynamic'

export default async function AdminStatsPage() {
  const auth = await createAuthClient()
  const { data: { user } } = await auth.auth.getUser()

  const supabase = createServerClient()
  const { data: orders } = await supabase.from('orders').select('status, price_total, country, bag_name, created_at')
  const { data: pieces } = await supabase.from('pieces').select('model, status, order_ref')
  const { data: visits } = await supabase.from('visits').select('session, created_at')

  const o = orders ?? []
  const p = pieces ?? []
  const v = visits ?? []

  // ── Trafic ──
  const now = Date.now()
  const dayMs = 86400000
  const isToday = (d: string) => new Date(d).toDateString() === new Date().toDateString()
  const pageViews = v.length
  const visitors = new Set(v.map(x => x.session).filter(Boolean)).size
  const viewsToday = v.filter(x => isToday(x.created_at)).length
  const visitorsToday = new Set(v.filter(x => isToday(x.created_at)).map(x => x.session)).size
  // 7 derniers jours (vues par jour)
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(now - (6 - i) * dayMs)
    const label = day.toLocaleDateString('fr-CA', { weekday: 'short' })
    const count = v.filter(x => new Date(x.created_at).toDateString() === day.toDateString()).length
    return { label, count }
  })
  const maxDay = Math.max(1, ...last7.map(d => d.count))
  const conversion = visitors > 0 ? ((o.length / visitors) * 100).toFixed(1) : '0'

  const paid = o.filter(x => ['payment_received', 'confirmed', 'shipped'].includes(x.status))
  const revenue = paid.reduce((s, x) => s + Number(x.price_total), 0)
  const pendingRevenue = o.filter(x => x.status === 'pending').reduce((s, x) => s + Number(x.price_total), 0)

  // Par pays
  const byCountry: Record<string, number> = {}
  o.forEach(x => { const c = x.country ?? '—'; byCountry[c] = (byCountry[c] ?? 0) + 1 })

  // Inventaire
  const sold = p.filter(x => x.status === 'sold')
  const inv = {
    total: p.length,
    available: p.filter(x => x.status === 'available').length,
    reserved: p.filter(x => x.status === 'reserved').length,
    sold: sold.length,
    soldOnline: sold.filter(x => x.order_ref).length,
    soldShop: sold.filter(x => !x.order_ref).length,
  }

  return (
    <AdminShell email={user?.email}>
      <AutoRefresh seconds={45} />
      <div className="flex flex-col gap-8">
        <h1 className="font-display text-[32px] font-light text-[#043672]">Statistiques</h1>

        {/* Trafic */}
        <Section title="Trafic">
          <Card label="Visiteurs (total)" value={String(visitors)} accent />
          <Card label="Pages vues (total)" value={String(pageViews)} />
          <Card label="Visiteurs aujourd'hui" value={String(visitorsToday)} />
          <Card label="Pages vues aujourd'hui" value={String(viewsToday)} />
        </Section>

        {/* Graphique 7 jours + conversion */}
        <div className="grid md:grid-cols-[1fr_auto] gap-6 items-end">
          <div>
            <h2 className="text-label text-[9px] text-[#b8965a] tracking-[4px] mb-4">Pages vues — 7 derniers jours</h2>
            <div className="flex items-end gap-2 h-28">
              {last7.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[9px] text-[#7a7a8a]">{d.count}</span>
                  <div className="w-full bg-[#043672]/10 relative" style={{ height: '80px' }}>
                    <div className="absolute bottom-0 left-0 right-0 bg-[#b8965a]" style={{ height: `${(d.count / maxDay) * 100}%` }} />
                  </div>
                  <span className="text-label text-[7px] text-[#7a7a8a] tracking-[1px]">{d.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-5 border border-[#b8965a]/40 bg-[#b8965a]/05 text-center min-w-[160px]">
            <p className="text-label text-[8px] text-[#7a7a8a] tracking-[2px] mb-2">Taux de conversion</p>
            <p className="font-display text-[32px] font-light text-[#043672]">{conversion}<span className="text-[16px] text-[#7a7a8a]">%</span></p>
            <p className="text-label text-[7px] text-[#7a7a8a] tracking-[1px] mt-1">commandes / visiteurs</p>
          </div>
        </div>

        {/* Ventes */}
        <Section title="Ventes">
          <Card label="Commandes totales" value={String(o.length)} />
          <Card label="Revenus confirmés" value={`${revenue} CAD`} accent />
          <Card label="En attente paiement" value={`${pendingRevenue} CAD`} />
          <Card label="Panier moyen" value={`${o.length ? Math.round((revenue + pendingRevenue) / o.length) : 0} CAD`} />
        </Section>

        {/* Inventaire */}
        <Section title="Inventaire">
          <Card label="Pièces totales" value={String(inv.total)} />
          <Card label="Disponibles" value={String(inv.available)} />
          <Card label="Réservées" value={String(inv.reserved)} />
          <Card label="Vendues" value={String(inv.sold)} accent />
        </Section>

        {/* Détail ventes */}
        <Section title="Détail des ventes">
          <Card label="Vendues en ligne" value={String(inv.soldOnline)} />
          <Card label="Vendues boutique" value={String(inv.soldShop)} />
        </Section>

        {/* Par pays */}
        <div>
          <h2 className="text-label text-[9px] text-[#b8965a] tracking-[4px] mb-3">Commandes par pays</h2>
          {Object.keys(byCountry).length === 0 ? (
            <p className="text-[13px] text-[#7a7a8a] font-light">Aucune commande.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {Object.entries(byCountry).sort((a, b) => b[1] - a[1]).map(([c, n]) => (
                <div key={c} className="flex items-center gap-3">
                  <span className="text-[12px] text-[#043672] w-12">{c}</span>
                  <div className="flex-1 h-2 bg-[#f0ebe0] overflow-hidden">
                    <div className="h-full bg-[#b8965a]" style={{ width: `${(n / o.length) * 100}%` }} />
                  </div>
                  <span className="text-[11px] text-[#7a7a8a] w-8 text-right">{n}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Note */}
        <div className="bg-[#f0ebe0] p-5 flex gap-4">
          <span className="text-[#b8965a] text-lg flex-shrink-0">✦</span>
          <div>
            <p className="text-label text-[9px] text-[#043672] tracking-[2px] mb-1.5">À propos du trafic</p>
            <p className="text-[12px] text-[#7a7a8a] font-light leading-relaxed">
              Visiteurs et pages vues sont comptés directement par le site (anonyme, sans cookie tiers).
              Pour les sources de trafic détaillées et la géographie, consulte <strong>Vercel → Analytics</strong>.
            </p>
          </div>
        </div>
      </div>
    </AdminShell>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-label text-[9px] text-[#b8965a] tracking-[4px] mb-3">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{children}</div>
    </div>
  )
}

function Card({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`p-5 border ${accent ? 'border-[#b8965a]/40 bg-[#b8965a]/05' : 'border-[#043672]/10 bg-[#faf7f2]'}`}>
      <p className="text-label text-[8px] text-[#7a7a8a] tracking-[2px] mb-2">{label}</p>
      <p className="font-display text-[24px] font-light text-[#043672]">{value}</p>
    </div>
  )
}
