'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Rafraîchit la page (server component) à intervalle régulier
export default function AutoRefresh({ seconds = 30 }: { seconds?: number }) {
  const router = useRouter()
  useEffect(() => {
    const id = setInterval(() => router.refresh(), seconds * 1000)
    return () => clearInterval(id)
  }, [router, seconds])
  return null
}
