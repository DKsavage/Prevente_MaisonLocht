'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLenis } from './LenisProvider'

// Bouton flèche "remonter en haut" — desktop + mobile
export default function ScrollToTop() {
  const { scrollToTop } = useLenis()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          onClick={scrollToTop}
          aria-label="Remonter en haut"
          data-cursor="hover"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 right-6 z-[150] w-11 h-11 md:w-12 md:h-12 flex items-center justify-center bg-[#043672] text-white shadow-[0_8px_28px_rgba(4,54,114,0.3)] hover:bg-[#0a4d9e] transition-colors cursor-none group"
        >
          <span className="text-base transition-transform duration-300 group-hover:-translate-y-0.5">↑</span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
