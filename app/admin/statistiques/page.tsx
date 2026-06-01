import { createAuthClient } from '@/lib/supabase-auth'
import { createServerClient } from '@/lib/supabase-server'
import AdminShell from '@/components/admin/AdminShell'

export const dynamic = 'force-dynamic'

export default async function AdminStatsPage() {
  const auth = await createAuthClient()
  const { data: { user } } = await auth.auth.getUser()

  const supabase = createServerClient()
  const { data: orders } = await supabase.from('orders').select('status, price_total, country, bag_name, created_at')
  const { data: pieces } = await supabase.from('pieces').select('model, status')

  const o = orders ?? []
  const p = pieces ?? []

  const paid = o.filter(x => ['payment_received', 'confirmed', 'shipped'].includes(x.status))
  const revenue = paid.reduce((s, x) => s + Number(x.price_total), 0)
  const pendingRevenue = o.filter(x => x.status === 'pending').reduce((s, x) => s + Number(x.price_total), 0)

  // Par pays
  const byCountry: Record<string, number> = {}
  o.forEach(x => { const c = x.country ?? '—'; byCountry[c] = (byCountry[c] ?? 0) + 1 })

  // Inventaire
  const inv = {
    total: p.length,
    available: p.filter(x => x.status === 'available').length,
    reserved: p.filter(x => x.status === 'reserved').length,
    sold: p.filter(x => x.status === 'sold').length,
  }

  return (
    <AdminShell email={user?.email}>
      <div className="flex flex-col gap-8">
        <h1 className="font-display text-[32px] font-light text-[#043672]">Statistiques</h1>

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

        {/* Note visiteurs */}
        <div className="bg-[#f0ebe0] p-5 flex gap-4">
          <span className="text-[#b8965a] text-lg flex-shrink-0">✦</span>
          <div>
            <p className="text-label text-[9px] text-[#043672] tracking-[2px] mb-1.5">Visiteurs & trafic</p>
            <p className="text-[12px] text-[#7a7a8a] font-light leading-relaxed">
              Le nombre de visiteurs, pages vues et sources de trafic est disponible dans
              <strong> Vercel → Analytics</strong>. Le suivi est actif sur le site.
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
