'use client'

import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

export default function Cursor() {
  // Désactive le curseur custom sur les appareils tactiles (pas de souris)
  const [enabled, setEnabled] = useState(false)
  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    setEnabled(fine)
  }, [])

  const mouseX = useMotionValue(-100)
  const mouseY = useMotionValue(-100)

  // Anneau intérieur — quasi instantané
  const innerX = useSpring(mouseX, { damping: 30, stiffness: 900, mass: 0.2 })
  const innerY = useSpring(mouseY, { damping: 30, stiffness: 900, mass: 0.2 })

  // Anneau extérieur — suit de près, léger trail
  const outerX = useSpring(mouseX, { damping: 26, stiffness: 420, mass: 0.35 })
  const outerY = useSpring(mouseY, { damping: 26, stiffness: 420, mass: 0.35 })

  const innerSize = useMotionValue(8)
  const outerSize = useMotionValue(32)
  const innerOpacity = useMotionValue(1)
  const outerOpacity = useMotionValue(1)

  useEffect(() => {
    if (!enabled) return
    const onMove = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }

    const onOver = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest('a, button, [data-cursor="hover"]')
      if (el) {
        innerSize.set(40)
        outerSize.set(40)
        innerOpacity.set(0)
      }

      const dark = (e.target as HTMLElement).closest('[data-theme="dark"]')
      if (dark) {
        document.getElementById('cursor-inner')?.classList.add('mix-blend-difference', '!border-white')
        document.getElementById('cursor-outer')?.classList.add('mix-blend-difference', '!border-white/30')
      }
    }

    const onOut = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest('a, button, [data-cursor="hover"]')
      if (el) {
        innerSize.set(8)
        outerSize.set(32)
        innerOpacity.set(1)
      }

      const dark = (e.target as HTMLElement).closest('[data-theme="dark"]')
      if (dark) {
        document.getElementById('cursor-inner')?.classList.remove('mix-blend-difference', '!border-white')
        document.getElementById('cursor-outer')?.classList.remove('mix-blend-difference', '!border-white/30')
      }
    }

    // Masque le curseur natif uniquement quand ce composant est monté (site vitrine)
    document.body.style.cursor = 'none'

    window.addEventListener('mousemove', onMove)
    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseout', onOut)

    return () => {
      document.body.style.cursor = ''
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout', onOut)
    }
  }, [enabled, mouseX, mouseY, innerSize, outerSize, innerOpacity])

  if (!enabled) return null

  return (
    <>
      {/* Anneau intérieur — précis */}
      <motion.div
        id="cursor-inner"
        className="fixed top-0 left-0 rounded-full border border-[#043672] pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2"
        style={{
          x: innerX,
          y: innerY,
          width: innerSize,
          height: innerSize,
          opacity: innerOpacity,
          transition: 'width 0.35s cubic-bezier(.16,1,.3,1), height 0.35s cubic-bezier(.16,1,.3,1)',
        }}
      />

      {/* Anneau extérieur — lerp */}
      <motion.div
        id="cursor-outer"
        className="fixed top-0 left-0 rounded-full border border-[#043672]/30 pointer-events-none z-[9998] -translate-x-1/2 -translate-y-1/2"
        style={{
          x: outerX,
          y: outerY,
          width: outerSize,
          height: outerSize,
          transition: 'width 0.4s cubic-bezier(.16,1,.3,1), height 0.4s cubic-bezier(.16,1,.3,1), border-color 0.3s',
        }}
      />
    </>
  )
}
