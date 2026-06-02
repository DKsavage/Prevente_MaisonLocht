import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-[#021f45] text-white/40 border-t border-white/05">
      <div className="max-w-[1200px] mx-auto px-8 md:px-14 py-12 flex flex-col md:flex-row items-center md:items-start justify-between gap-8">

        {/* Logo + tagline */}
        <div className="flex flex-col items-center md:items-start gap-3">
          <Image src="/images/logo-blanc.png" alt="Maison Locht" width={120} height={28} className="h-6 w-auto opacity-50" />
          <p className="text-label text-[9px] tracking-[3px] text-white/25">LOCHT 01 · LES CERNES · 2026</p>
        </div>

        {/* Mentions */}
        <div className="flex flex-col items-center md:items-end gap-2 text-center md:text-right">
          <p className="text-[10px] leading-relaxed text-white/30 max-w-[300px]">
            Chaque création est définitive.<br />
            Les ajustements sont assurés à vie.<br />
            Max 2 par commande · pièces uniques, jamais reproduites.
          </p>
          <p className="text-[9px] text-white/15 tracking-[1px] mt-1">
            © {new Date().getFullYear()} Maison Locht. Tous droits réservés.
          </p>
        </div>

      </div>
    </footer>
  )
}
