'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from './LangContext'

const content = {
  fr: {
    announcement: 'Pré-vente exclusive',
    label: 'LOCHT 01 · LES CERNES',
    note: 'Pièces uniques · jamais reproduites',
    links: [
      { label: 'Collection', href: '#collection' },
      { label: 'Histoire',   href: '#histoire' },
      { label: 'Commander',  href: '#commander' },
    ],
    lang: 'EN',
    close: 'Fermer',
  },
  en: {
    announcement: 'Exclusive pre-sale',
    label: 'LOCHT 01 · LES CERNES',
    note: 'One-of-a-kind · never reproduced',
    links: [
      { label: 'Collection', href: '#collection' },
      { label: 'Story',      href: '#histoire' },
      { label: 'Order',      href: '#commander' },
    ],
    lang: 'FR',
    close: 'Close',
  },
}

const ease = [0.16, 1, 0.3, 1] as const

export default function Nav() {
  const { lang, toggle } = useLang()
  const [scrolled, setScrolled]   = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)
  const t = content[lang]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Bloquer le scroll quand menu ouvert
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <>
      {/* ── Announcement bar ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
        className="bg-[#043672] text-white/70 text-center py-3 px-4"
      >
        <p className="text-label text-[10px] tracking-[3px]">
          <AnimatePresence mode="wait">
            <motion.span
              key={lang}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="inline-flex items-center gap-3"
            >
              {t.announcement}
              <span className="text-[#d4aa6a] font-normal">{t.label}</span>
              <span className="text-white/30">·</span>
              {t.note}
            </motion.span>
          </AnimatePresence>
        </p>
      </motion.div>

      {/* ── Nav ── */}
      <motion.nav
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1, ease }}
        className={`sticky top-0 z-[100] flex items-center justify-between px-8 md:px-14 transition-all duration-500 ${
          scrolled
            ? 'py-3 bg-[#faf7f2]/90 backdrop-blur-xl border-b border-[#043672]/08 shadow-[0_4px_32px_rgba(4,54,114,0.06)]'
            : 'py-5 bg-[#faf7f2]/70 backdrop-blur-md'
        }`}
      >
        {/* Logo */}
        <a href="/" className="flex-shrink-0" aria-label="Maison Locht">
          <Image src="/images/logo-bleu.png" alt="Maison Locht" width={140} height={32} className="h-7 w-auto object-contain" priority />
        </a>

        {/* Links desktop */}
        <ul className="hidden md:flex items-center gap-10 list-none">
          <AnimatePresence mode="wait">
            {t.links.map((link, i) => (
              <motion.li
                key={`${lang}-${link.label}`}
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.05, duration: 0.4 }}
              >
                <a href={link.href} className="text-label text-[10px] text-[#7a7a8a] hover:text-[#043672] relative pb-[3px] group transition-colors duration-200">
                  {link.label}
                  <span className="absolute bottom-0 left-0 h-px w-0 bg-[#043672] group-hover:w-full transition-[width] duration-[350ms] ease-[cubic-bezier(.16,1,.3,1)]" />
                </a>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        {/* Droite : lang + hamburger */}
        <div className="flex items-center gap-3">
          <motion.button
            onClick={toggle}
            className="text-label text-[10px] text-[#7a7a8a] hover:text-[#043672] border border-[#043672]/15 hover:border-[#043672] px-3.5 py-1.5 transition-all duration-200"
            whileTap={{ scale: 0.96 }}
          >
            {t.lang}
          </motion.button>

          {/* Hamburger mobile */}
          <button
            onClick={() => setMenuOpen(true)}
            className="md:hidden flex flex-col gap-[5px] items-center justify-center w-9 h-9"
            aria-label="Ouvrir le menu"
          >
            <span className="block w-5 h-px bg-[#043672] transition-all duration-200" />
            <span className="block w-5 h-px bg-[#043672] transition-all duration-200" />
            <span className="block w-3 h-px bg-[#b8965a] transition-all duration-200" />
          </button>
        </div>
      </motion.nav>

      {/* ── Menu mobile full-screen ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-[200] bg-[#021f45] flex flex-col overflow-hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Halo or */}
            <div className="absolute -bottom-32 -right-32 w-[360px] h-[360px] rounded-full bg-[radial-gradient(circle,rgba(184,150,90,0.07)_0%,transparent_65%)] pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-white/08 flex-shrink-0">
              <Image src="/images/logo-blanc.png" alt="Maison Locht" width={120} height={28} className="h-6 w-auto opacity-80" />
              <button
                onClick={() => setMenuOpen(false)}
                className="w-10 h-10 flex items-center justify-center border border-white/15 hover:border-[#d4aa6a]/60 text-white/60 hover:text-white text-2xl transition-all duration-200"
                aria-label={t.close}
              >
                ×
              </button>
            </div>

            {/* Liens — typographie éditoriale */}
            <div className="flex-1 flex flex-col justify-center px-8 gap-0">
              {t.links.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.09 + 0.1, duration: 0.5, ease }}
                  className="font-display text-[52px] font-light text-white/85 hover:text-[#d4aa6a] transition-colors duration-300 leading-none py-4 border-b border-white/06 flex items-center justify-between group"
                >
                  {link.label}
                  <span className="text-[20px] text-white/20 group-hover:text-[#d4aa6a] group-hover:translate-x-1 transition-all duration-300">→</span>
                </motion.a>
              ))}
            </div>

            {/* Pied — lang + mention */}
            <div className="px-8 py-6 border-t border-white/08 flex items-center justify-between flex-shrink-0">
              <span className="text-[10px] text-white/25 tracking-[3px] uppercase">Locht 01 · Les Cernes</span>
              <button
                onClick={() => { toggle(); }}
                className="text-label text-[10px] text-white/50 hover:text-white border border-white/15 hover:border-[#d4aa6a]/50 px-3.5 py-1.5 transition-all duration-200"
              >
                {t.lang}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
