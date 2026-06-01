'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Identifiants invalides')
      setLoading(false)
      return
    }
    router.push('/admin')
    router.refresh()
  }

  const inputClass = 'w-full bg-[#faf7f2] border border-[#043672]/15 focus:border-[#b8965a] outline-none px-4 py-3 text-[13px] text-[#1a1a2e] transition-colors duration-200 font-light'

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#ede8df] px-6">
      <div className="w-full max-w-[380px]">
        <div className="text-center mb-10">
          <Image src="/images/logo-bleu.png" alt="Maison Locht" width={160} height={36} className="h-8 w-auto mx-auto mb-6" priority />
          <p className="text-label text-[9px] text-[#b8965a] tracking-[5px]">Espace administration</p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col">
            <label className="text-label text-[8px] text-[#b8965a] tracking-[3px] mb-1.5">Courriel</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputClass} autoComplete="email" />
          </div>
          <div className="flex flex-col">
            <label className="text-label text-[8px] text-[#b8965a] tracking-[3px] mb-1.5">Mot de passe</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className={inputClass} autoComplete="current-password" />
          </div>

          {error && <p className="text-[11px] text-red-500">{error}</p>}

          <button type="submit" disabled={loading}
            className="mt-2 bg-[#043672] text-white text-label text-[9px] tracking-[3px] py-4 hover:bg-[#0a4d9e] transition-colors duration-200 disabled:opacity-50">
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
