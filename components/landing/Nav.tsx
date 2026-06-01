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
    links: [{ label: 'Collection', href: '#collection' }, { label: 'Histoire', href: '#histoire' }, { label: 'Commander', href: '#commander' }],
    lang: 'EN',
  },
  en: {
    announcement: 'Exclusive pre-sale',
    label: 'LOCHT 01 · LES CERNES',
    note: 'One-of-a-kind · never reproduced',
    links: [{ label: 'Collection', href: '#collection' }, { label: 'Story', href: '#histoire' }, { label: 'Order', href: '#commander' }],
    lang: 'FR',
  },
}

export default function Nav() {
  const { lang, toggle } = useLang()
  const [scrolled, setScrolled] = useState(false)
  const t = content[lang]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      {/* Announcement bar */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="bg-[#043672] text-white/70 text-center py-3 px-4"
      >
        <p className="text-label text-[10px] tracking-[3px]">
          <AnimatePresence mode="wait">
            <motion.span
              key={lang}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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

      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className={`sticky top-0 z-[100] flex items-center justify-between px-8 md:px-14 transition-all duration-500 ${
          scrolled
            ? 'py-3 bg-[#faf7f2]/90 backdrop-blur-xl border-b border-[#043672]/08 shadow-[0_4px_32px_rgba(4,54,114,0.06)]'
            : 'py-5 bg-[#faf7f2]/70 backdrop-blur-md'
        }`}
      >
        {/* Logo */}
        <a href="/" className="flex-shrink-0" aria-label="Maison Locht">
          <Image
            src="/images/logo-bleu.png"
            alt="Maison Locht"
            width={140}
            height={32}
            className="h-7 w-auto object-contain"
            priority
          />
        </a>

        {/* Links — desktop */}
        <ul className="hidden md:flex items-center gap-10 list-none">
          <AnimatePresence mode="wait">
            {t.links.map((link, i) => (
              <motion.li
                key={`${lang}-${link.label}`}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.05, duration: 0.4 }}
              >
                <a
                  href={link.href}
                  className="text-label text-[9px] text-[#7a7a8a] hover:text-[#043672] relative pb-[3px] group transition-colors duration-200"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 h-px w-0 bg-[#043672] group-hover:w-full transition-[width] duration-[350ms] ease-[cubic-bezier(.16,1,.3,1)]" />
                </a>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        {/* Lang toggle */}
        <motion.button
          onClick={toggle}
          className="text-label text-[9px] text-[#7a7a8a] hover:text-[#043672] border border-[#043672]/15 hover:border-[#043672] px-3.5 py-1.5 transition-all duration-200"
          whileTap={{ scale: 0.96 }}
          data-cursor="hover"
        >
          {t.lang}
        </motion.button>
      </motion.nav>
    </>
  )
}
