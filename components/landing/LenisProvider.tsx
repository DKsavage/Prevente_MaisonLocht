'use client'

import { createContext, useContext, useEffect, useRef } from 'react'
import Lenis from 'lenis'

type LenisCtx = { stop: () => void; start: () => void }
const LenisContext = createContext<LenisCtx>({ stop: () => {}, start: () => {} })
export const useLenis = () => useContext(LenisContext)

export default function LenisProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    if (window.matchMedia('(max-width: 768px)').matches) return

    const lenis = new Lenis({
      lerp: 0.14,          // plus réactif, moins flottant
      smoothWheel: true,
      wheelMultiplier: 1.15, // un peu plus rapide
      touchMultiplier: 1.6,
    })
    lenisRef.current = lenis

    let rafId: number
    const raf = (time: number) => { lenis.raf(time); rafId = requestAnimationFrame(raf) }
    rafId = requestAnimationFrame(raf)

    return () => { lenis.destroy(); cancelAnimationFrame(rafId) }
  }, [])

  const stop  = () => lenisRef.current?.stop()
  const start = () => lenisRef.current?.start()

  return (
    <LenisContext.Provider value={{ stop, start }}>
      {children}
    </LenisContext.Provider>
  )
}
