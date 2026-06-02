import Image from 'next/image'

const tabs = ['Accueil', 'Commandes', 'Inventaire', 'Statistiques']

export default function AdminSkeletonShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="relative bg-gradient-to-b from-[#043672] to-[#021f45] text-white overflow-hidden">
        <div className="absolute -top-20 right-10 w-64 h-64 rounded-full bg-[radial-gradient(circle,rgba(184,150,90,0.10)_0%,transparent_70%)] pointer-events-none" />
        <div className="relative max-w-[1200px] mx-auto px-6 md:px-10 flex items-center justify-between h-16">
          <div className="flex items-center gap-5">
            <Image src="/images/logo-blanc.png" alt="Maison Locht" width={120} height={28} className="h-6 w-auto opacity-90" />
            <span className="hidden sm:block w-px h-5 bg-white/15" />
            <span className="hidden sm:block text-label text-[10px] text-[#d4aa6a]/80 tracking-[4px]">Administration</span>
          </div>
        </div>
        <nav className="relative max-w-[1200px] mx-auto px-6 md:px-10 flex gap-1">
          {tabs.map(label => (
            <span key={label} className="text-label text-[10px] tracking-[2px] px-4 py-3.5 border-b-2 border-transparent text-white/45">
              {label}
            </span>
          ))}
        </nav>
      </header>
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 md:px-10 py-8 pb-28 md:pb-8">
        {children}
      </main>
    </div>
  )
}

export function Bone({ className }: { className: string }) {
  return <div className={`bg-[#043672]/08 animate-pulse rounded-sm ${className}`} />
}
