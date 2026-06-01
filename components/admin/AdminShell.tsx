'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const tabs = [
  { href: '/admin',           label: 'Commandes' },
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
      <header className="bg-[#043672] text-white">
        <div className="max-w-[1200px] mx-auto px-6 md:px-10 flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Image src="/images/logo-blanc.png" alt="Maison Locht" width={120} height={28} className="h-6 w-auto opacity-90" />
            <span className="hidden sm:block text-label text-[8px] text-white/40 tracking-[3px]">Administration</span>
          </div>
          <div className="flex items-center gap-4">
            {email && <span className="hidden md:block text-[11px] text-white/50 font-light">{email}</span>}
            <button onClick={logout}
              className="text-label text-[8px] text-white/70 hover:text-white tracking-[2px] border border-white/20 hover:border-white/50 px-3 py-1.5 transition-colors">
              Déconnexion
            </button>
          </div>
        </div>
        {/* Onglets */}
        <nav className="max-w-[1200px] mx-auto px-6 md:px-10 flex gap-1">
          {tabs.map(tab => {
            const active = pathname === tab.href
            return (
              <Link key={tab.href} href={tab.href}
                className={`text-label text-[9px] tracking-[2px] px-4 py-3 border-b-2 transition-colors ${
                  active ? 'border-[#d4aa6a] text-white' : 'border-transparent text-white/50 hover:text-white/80'
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
