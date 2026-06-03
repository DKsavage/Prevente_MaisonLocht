'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await createClient().auth.signInWithPassword({ email, password })
    if (error) {
      setError('Identifiants invalides')
      setLoading(false)
      return
    }
    router.push('/admin')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Panneau gauche — éditorial (desktop) ── */}
      <div className="hidden md:flex md:w-[46%] relative bg-[#021f45] flex-col justify-between p-12 overflow-hidden select-none">
        {/* Halo or en bas à droite */}
        <div className="absolute -bottom-20 -right-20 w-[360px] h-[360px] rounded-full bg-[radial-gradient(circle,rgba(184,150,90,0.09)_0%,transparent_65%)] pointer-events-none" />
        {/* Grain léger */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

        {/* Logo */}
        <Image src="/images/logo-blanc.png" alt="Maison Locht" width={140} height={32} className="h-7 w-auto opacity-85 relative z-10" priority />

        {/* Citation éditoriale — ancre mémorable */}
        <div className="relative z-10">
          <span className="block w-10 h-px bg-[#b8965a] mb-8" />
          <p className="font-display text-[44px] font-light text-white/90 leading-[1.1] italic">
            Les routes<br />tracées<br />dans le tissu.
          </p>
          <p className="mt-7 text-[10px] text-[#d4aa6a]/50 tracking-[4px] font-light uppercase">
            Collection Locht 01 — Les Cernes
          </p>
        </div>

        {/* Bas */}
        <p className="relative z-10 text-[10px] text-white/15 tracking-[3px] uppercase">Espace privé</p>
      </div>

      {/* ── Panneau droit — formulaire ── */}
      <div className="flex-1 flex items-center justify-center bg-[#faf7f2] px-8 py-12">
        <div className="w-full max-w-[340px]">

          {/* Logo mobile uniquement */}
          <div className="md:hidden text-center mb-10">
            <Image src="/images/logo-bleu.png" alt="Maison Locht" width={140} height={32} className="h-7 w-auto mx-auto mb-5" priority />
          </div>

          {/* En-tête formulaire */}
          <div className="mb-10">
            <p className="text-label text-[10px] text-[#b8965a] tracking-[5px] mb-2">Administration</p>
            <h1 className="font-display text-[30px] font-light text-[#043672] leading-none">Connexion</h1>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-5">

            <div className="flex flex-col gap-2">
              <label className="text-label text-[10px] text-[#7a7a8a] tracking-[2px]">Courriel</label>
              <input
                type="email" required autoFocus
                value={email} onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full bg-white border border-[#043672]/12 focus:border-[#b8965a] outline-none px-4 py-3.5 text-[13px] text-[#1a1a2e] transition-colors duration-200 font-light placeholder:text-[#7a7a8a]/40"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-label text-[10px] text-[#7a7a8a] tracking-[2px]">Mot de passe</label>
              <input
                type="password" required
                value={password} onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full bg-white border border-[#043672]/12 focus:border-[#b8965a] outline-none px-4 py-3.5 text-[13px] text-[#1a1a2e] transition-colors duration-200 font-light"
              />
            </div>

            {error && (
              <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                <p className="text-[11px] text-red-600 font-light">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="relative mt-1 bg-[#043672] text-white text-label text-[10px] tracking-[4px] py-4 hover:bg-[#0a4d9e] active:bg-[#021f45] transition-colors duration-300 disabled:opacity-50 overflow-hidden">
              <span className={`transition-opacity duration-150 ${loading ? 'opacity-0' : 'opacity-100'}`}>
                Se connecter
              </span>
              {loading && (
                <span className="absolute inset-0 flex items-center justify-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-white/60 animate-bounce [animation-delay:0ms]" />
                  <span className="w-1 h-1 rounded-full bg-white/60 animate-bounce [animation-delay:150ms]" />
                  <span className="w-1 h-1 rounded-full bg-white/60 animate-bounce [animation-delay:300ms]" />
                </span>
              )}
            </button>

          </form>

          <p className="mt-10 text-[10px] text-[#7a7a8a]/40 tracking-[2px] text-center uppercase">
            Maison Locht · Espace privé
          </p>
        </div>
      </div>

    </div>
  )
}
