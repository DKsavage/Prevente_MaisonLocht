'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const tabs = [
  { href: '/admin',            label: 'Accueil' },
  { href: '/admin/commandes',  label: 'Commandes' },
  { href: '/admin/inventaire', label: 'Inventaire' },
  { href: '/admin/statistiques', label: 'Statistiques' },
]

export default function AdminShell({ children, email }: { children: React.ReactNode; email?: string }) {
  const pathname = usePathname()
  const router = useRouter()

  const logout = async () => {
    await createClient().auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Barre supérieure */}
      <header className="relative bg-gradient-to-b from-[#043672] to-[#021f45] text-white overflow-hidden">
        {/* Halo or discret */}
        <div className="absolute -top-20 right-10 w-64 h-64 rounded-full bg-[radial-gradient(circle,rgba(184,150,90,0.10)_0%,transparent_70%)] pointer-events-none" />
        <div className="relative max-w-[1200px] mx-auto px-6 md:px-10 flex items-center justify-between h-16">
          <div className="flex items-center gap-5">
            <Image src="/images/logo-blanc.png" alt="Maison Locht" width={120} height={28} className="h-6 w-auto opacity-90" />
            <span className="hidden sm:block w-px h-5 bg-white/15" />
            <span className="hidden sm:block text-label text-[8px] text-[#d4aa6a]/80 tracking-[4px]">Administration</span>
          </div>
          <div className="flex items-center gap-4">
            {email && <span className="hidden md:block text-[11px] text-white/45 font-light">{email}</span>}
            <button onClick={logout}
              className="text-label text-[8px] text-white/70 hover:text-white tracking-[2px] border border-white/20 hover:border-[#d4aa6a]/60 px-3 py-1.5 transition-colors">
              Déconnexion
            </button>
          </div>
        </div>
        {/* Onglets */}
        <nav className="relative max-w-[1200px] mx-auto px-6 md:px-10 flex gap-1">
          {tabs.map(tab => {
            const active = pathname === tab.href
            return (
              <Link key={tab.href} href={tab.href}
                className={`text-label text-[9px] tracking-[2px] px-4 py-3.5 border-b-2 transition-all duration-300 ${
                  active ? 'border-[#d4aa6a] text-white' : 'border-transparent text-white/45 hover:text-white/80'
                }`}>
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </header>

      {/* Contenu */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 md:px-10 py-8">
        {children}
      </main>
    </div>
  )
}
