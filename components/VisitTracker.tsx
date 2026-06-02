'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

// Enregistre une visite par session + page (anonyme). Site public uniquement.
export default function VisitTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return

    // Session anonyme persistante (par onglet/navigateur)
    let session = ''
    try {
      session = localStorage.getItem('ml_sid') || ''
      if (!session) {
        session = Math.random().toString(36).slice(2) + Date.now().toString(36)
        localStorage.setItem('ml_sid', session)
      }
    } catch { /* ignore */ }

    // Évite de compter plusieurs fois la même page dans la même session
    const key = `ml_v_${pathname}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
    } catch { /* ignore */ }

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname, session, referrer: document.referrer || '' }),
      keepalive: true,
    }).catch(() => {})
  }, [pathname])

  return null
}
