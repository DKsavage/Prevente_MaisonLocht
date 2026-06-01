'use client'

import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import { useLang } from './LangContext'
import { usePieces } from './PiecesProvider'

const content = {
  fr: {
    eyebrow: 'LOCHT 01',
    collection: 'Les Cernes',
    title: ['Les routes', 'que l\'on', 'porte'],
    titleItalic: 'porte',
    desc: 'Sacs artisanaux en cuir végétal, batik et pagne tissé du Fouta. Chaque pièce trace une route — hommage au monde.',
    tag: 'Pièce unique · jamais reproduite',
    cta: 'Découvrir la collection',
    pulse: 'Pré-vente ouverte',
    badgeTxt: 'pièces disponibles',
    floatTag: 'Canada · 2026',
  },
  en: {
    eyebrow: 'LOCHT 01',
    collection: 'Les Cernes',
    title: ['The roads', 'we', 'carry'],
    titleItalic: 'carry',
    desc: 'Handcrafted bags in vegetable leather, batik and woven Fouta pagne. Each piece traces a route — a tribute to the world.',
    tag: 'One-of-a-kind · never reproduced',
    cta: 'Discover the collection',
    pulse: 'Pre-sale open',
    badgeTxt: 'pieces available',
    floatTag: 'Canada · 2026',
  },
}

const ease = [0.16, 1, 0.3, 1] as const

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.9, delay, ease },
})

// Count-up hook — retourne done=true quand terminé
function useCountUp(target: number, duration = 1400) {
  const [count, setCount] = useState(0)
  const [done, setDone] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -60px 0px' })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) {
        setCount(target)
        setDone(true)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [inView, target, duration])

  return { count, done, ref }
}

export default function Hero() {
  const { lang } = useLang()
  const t = content[lang]
  // Nombre réel de pièces disponibles (live, via la source partagée)
  const { availableCount } = usePieces()
  const { count, done, ref: badgeRef } = useCountUp(availableCount)
  const [hovered, setHovered] = useState(false)

  return (
    <section className="grid md:grid-cols-2 min-h-[88vh] border-b border-[#043672]/05">

      {/* ── Côté texte ── */}
      <div className="flex flex-col justify-center gap-7 px-8 md:px-14 py-16 md:py-24 order-2 md:order-1">

        {/* Eyebrow */}
        <motion.div {...fadeUp(0.1)} className="flex items-center gap-4">
          <span className="block w-6 h-px bg-[#b8965a]" />
          <span className="text-label text-[8px] text-[#b8965a] tracking-[6px]">{t.eyebrow}</span>
          <span className="text-label text-[8px] text-[#b8965a]/60 tracking-[5px] font-light">{t.collection}</span>
        </motion.div>

        {/* Titre staggeré ligne par ligne */}
        <motion.h1
          className="font-display text-[54px] md:text-[72px] font-light leading-[1.01] text-[#043672] tracking-tight"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          {t.title.map((line, i) => (
            <motion.span
              key={i}
              className={`block overflow-hidden`}
              variants={{ hidden: {}, visible: {} }}
            >
              <motion.span
                className={`block ${line === t.titleItalic ? 'italic' : ''}`}
                variants={{
                  hidden: { y: '100%', opacity: 0 },
                  visible: { y: 0, opacity: 1, transition: { duration: 0.85, ease } },
                }}
              >
                {line}
              </motion.span>
            </motion.span>
          ))}
        </motion.h1>

        {/* Description */}
        <motion.div {...fadeUp(0.52)} className="border-l-2 border-[#b8965a] pl-5 flex flex-col gap-2.5">
          <p className="text-[12.5px] leading-[1.9] text-[#7a7a8a] font-light max-w-[290px]">
            {t.desc}
          </p>
          <span className="text-label text-[9px] text-[#b8965a] tracking-[3px] flex items-center gap-2">
            <span className="text-[7px]">✦</span>
            {t.tag}
          </span>
        </motion.div>

        {/* CTA */}
        <motion.div {...fadeUp(0.65)} className="flex items-center gap-6 mt-1">
          <a
            href="#collection"
            className="group relative inline-flex items-center gap-4 bg-[#043672] text-white overflow-hidden px-8 py-[15px]"
            data-cursor="hover"
          >
            <span className="absolute inset-0 bg-[#0a4d9e] -translate-x-full group-hover:translate-x-0 transition-transform duration-[420ms] ease-[cubic-bezier(.16,1,.3,1)]" />
            <span className="relative text-label text-[9px] tracking-[3px]">{t.cta}</span>
            <span className="relative text-sm transition-transform duration-300 group-hover:translate-x-1.5">→</span>
          </a>

          <span className="flex items-center gap-2 text-label text-[9px] text-[#7a7a8a] tracking-[2px]">
            <span className="w-[5px] h-[5px] rounded-full bg-[#b8965a] animate-pulse" />
            {t.pulse}
          </span>
        </motion.div>
      </div>

      {/* ── Côté image ── */}
      <div className="relative bg-[#f0ebe0] flex items-center justify-center overflow-hidden order-1 md:order-2 min-h-[60vw] md:min-h-0">

        {/* Halos décoratifs */}
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(4,54,114,0.06)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-52 h-52 rounded-full bg-[radial-gradient(circle,rgba(184,150,90,0.07)_0%,transparent_70%)] pointer-events-none" />

        {/* Cadre photo avec crossfade au hover */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, delay: 0.2, ease }}
          className="relative w-[65%] md:w-[60%] aspect-[3/4] border border-[#043672]/08 shadow-[20px_20px_0_rgba(4,54,114,0.05)] overflow-hidden cursor-none"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          data-cursor="hover"
        >
          {/* Photo principale — recule au hover */}
          <Image
            src="/images/collection.jpeg"
            alt="Collection Maison Locht"
            fill
            className="object-cover object-center will-change-transform"
            style={{
              opacity: hovered ? 0 : 1,
              transform: hovered ? 'scale(1.06)' : 'scale(1)',
              transition: 'opacity 1100ms cubic-bezier(.4,0,.2,1), transform 1100ms cubic-bezier(.4,0,.2,1)',
            }}
            priority
            sizes="(max-width: 768px) 70vw, 35vw"
          />

          {/* Photo secondaire — avance au hover */}
          <Image
            src="/images/4mannequins.jpeg"
            alt="Maison Locht — Les Cernes"
            fill
            className="object-cover object-top will-change-transform"
            style={{
              opacity: hovered ? 1 : 0,
              transform: hovered ? 'scale(1)' : 'scale(1.06)',
              transition: 'opacity 1100ms cubic-bezier(.4,0,.2,1), transform 1100ms cubic-bezier(.4,0,.2,1)',
            }}
            sizes="(max-width: 768px) 70vw, 35vw"
          />
        </motion.div>

        {/* Badge count-up */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.75, ease }}
          className="absolute bottom-8 left-6 md:left-8 bg-[#043672] text-white px-5 py-4 text-center"
          style={{
            animation: done ? 'badge-glow 2.8s ease-in-out infinite' : undefined,
            boxShadow: '0 16px 40px rgba(4,54,114,0.3)',
          }}
        >
          {/* Shimmer sur le chiffre quand count-up terminé */}
          <span
            ref={badgeRef}
            className="font-display text-[32px] font-light leading-none block tabular-nums"
            style={done ? {
              background: 'linear-gradient(90deg, #fff 30%, #d4aa6a 50%, #fff 70%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'shimmer-sweep 2s ease-in-out 1',
            } : { color: '#fff' }}
          >
            {count}
          </span>
          <span className="text-label text-[7px] text-white/50 tracking-[2px] mt-1.5 block">{t.badgeTxt}</span>

          {/* Indicateur urgence — apparaît après count-up */}
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={done ? { opacity: 1, height: 'auto' } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-center gap-1.5 mt-2 pt-2 border-t border-white/10">
              <span
                className="w-1 h-1 rounded-full bg-[#d4aa6a]"
                style={{ animation: 'urgency-pulse 2s ease-in-out infinite' }}
              />
              <span className="text-label text-[7px] text-[#d4aa6a]/70 tracking-[2px]">
                {lang === 'fr' ? 'disponibles' : 'available'}
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* Tag flottant */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="absolute top-6 right-6 border border-[#b8965a]/50 text-[#b8965a] text-label text-[8px] tracking-[3px] px-3.5 py-1.5 bg-[#faf7f2]/60 backdrop-blur-sm"
        >
          {t.floatTag}
        </motion.div>
      </div>
    </section>
  )
}
