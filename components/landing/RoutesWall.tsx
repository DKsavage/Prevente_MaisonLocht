import { createServerClient } from '@/lib/supabase-server'

export default async function RoutesWall() {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('orders')
    .select('why_locht')
    .not('why_locht', 'is', null)
    .neq('why_locht', '')
    .order('created_at', { ascending: false })
    .limit(9)

  const messages = (data ?? []).map(o => o.why_locht as string).filter(Boolean)

  if (messages.length < 2) return null

  return (
    <section className="relative bg-[#021f45] overflow-hidden py-20 px-8 md:px-14">
      {/* Halos */}
      <div className="absolute -top-32 -right-32 w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(184,150,90,0.07)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.02)_0%,transparent_70%)] pointer-events-none" />

      {/* En-tête */}
      <div className="flex items-center gap-4 mb-12">
        <span className="block w-8 h-px bg-[#b8965a]" />
        <span className="text-label text-[10px] text-[#b8965a] tracking-[5px]">LES ROUTES</span>
        <span className="flex-1 h-px bg-white/06" />
        <span className="text-label text-[10px] text-white/20 tracking-[3px]">{messages.length} voix</span>
      </div>

      {/* Grille de citations */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-[1100px] mx-auto">
        {messages.map((msg, i) => (
          <div
            key={i}
            className="group bg-white/[0.03] border border-white/06 hover:border-[#b8965a]/30 px-6 py-7 transition-colors duration-500"
          >
            <span className="font-display text-[#b8965a]/30 text-[36px] leading-none block mb-3 group-hover:text-[#b8965a]/50 transition-colors duration-500">
              &ldquo;
            </span>
            <p className="font-display text-[17px] font-light text-white/75 italic leading-relaxed">
              {msg}
            </p>
          </div>
        ))}
      </div>

      {/* Signature */}
      <div className="flex justify-center mt-12">
        <span className="text-label text-[9px] text-white/15 tracking-[4px]">
          MAISON LOCHT · COLLECTION LOCHT 01
        </span>
      </div>
    </section>
  )
}
