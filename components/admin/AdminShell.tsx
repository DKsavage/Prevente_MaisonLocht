'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Home, Package, LayoutGrid, BarChart2, BookOpen } from 'lucide-react'

const tabs = [
  { href: '/admin',              label: 'Accueil',      Icon: Home },
  { href: '/admin/commandes',    label: 'Commandes',    Icon: Package },
  { href: '/admin/inventaire',   label: 'Inventaire',   Icon: LayoutGrid },
  { href: '/admin/statistiques', label: 'Statistiques', Icon: BarChart2 },
  { href: '/admin/aide',         label: 'Aide',         Icon: BookOpen },
]

export default function AdminShell({ children, email }: { children: React.ReactNode; email?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const tick = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(tick)
  }, [])

  useEffect(() => {
    const reset = () => setElapsed(0)
    window.addEventListener('ml-refresh', reset)
    return () => window.removeEventListener('ml-refresh', reset)
  }, [])

  const logout = async () => {
    await createClient().auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  const elapsedLabel = elapsed < 60
    ? `${elapsed}s`
    : `${Math.floor(elapsed / 60)}min`

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
          <div className="flex items-center gap-4">
            <span className="hidden md:block text-[10px] text-white/25 font-light tabular-nums">
              Mis à jour il y a {elapsedLabel}
            </span>
            {email && <span className="hidden lg:block text-[11px] text-white/45 font-light">{email}</span>}
            <button onClick={logout}
              className="text-label text-[10px] text-white/70 hover:text-white tracking-[2px] border border-white/20 hover:border-[#d4aa6a]/60 px-3 py-1.5 transition-colors">
              Déconnexion
            </button>
          </div>
        </div>
        <nav className="relative max-w-[1200px] mx-auto px-6 md:px-10 flex gap-1">
          {tabs.map(tab => {
            const active = pathname === tab.href
            return (
              <Link key={tab.href} href={tab.href}
                className={`text-label text-[10px] tracking-[2px] px-4 py-3.5 border-b-2 transition-all duration-300 ${
                  active ? 'border-[#d4aa6a] text-white' : 'border-transparent text-white/45 hover:text-white/80'
                }`}>
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </header>

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 md:px-10 py-8 pb-28 md:pb-8">
        {children}
      </main>

      {/* Bottom nav mobile uniquement */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#021f45] border-t border-white/10 flex">
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors ${
                active ? 'text-[#d4aa6a]' : 'text-white/40 hover:text-white/70'
              }`}>
              <Icon size={20} strokeWidth={1.5} />
              <span className="text-label text-[8px] tracking-[1px]">{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
