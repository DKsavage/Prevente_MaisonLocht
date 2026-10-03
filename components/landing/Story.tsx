'use client'

import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { useLang } from './LangContext'

const ease = [0.16, 1, 0.3, 1] as const

const content = {
  fr: {
    eyebrow: 'Origine',
    facts: [
      { value: 'Belgo-Haïtienne', label: 'Origine' },
      { value: 'Sénégal · Congo · Guinée', label: 'Racines' },
      { value: 'Mémoire portée', label: 'Vision' },
    ],
    descTitle: "Ce que l'on porte",
    desc: "La collection LES CERNES naît d'une géographie personnelle — Bruxelles, Port-au-Prince, Dakar, Conakry. Chaque pièce assemble du pagne tissé du Fouta, du batik et du cuir végétal, travaillés à la main. Les lignes parallèles qui traversent chaque sac ne sont pas un motif. Ce sont des routes. Un hommage à Haïti — pays inaccessible, toujours présent. Maison Locht ne fait pas de la mode. Elle fait de la mémoire.",
    pillars: [
      { label: 'Savoir-faire', value: 'Cousu à la main, pièce par pièce' },
      { label: 'Unicité', value: 'Jamais reproduite, jamais répétée' },
      { label: 'Héritage', value: '3 continents tissés en une seule pièce' },
    ],
    photoCaption: 'Collection LOCHT 01 · LES CERNES',
    continues: 'Aujourd’hui, cette route continue.',
    continuesLink: 'Voir la collection',
  },
  en: {
    eyebrow: 'Origin',
    facts: [
      { value: 'Belgian-Haitian', label: 'Origin' },
      { value: 'Senegal · Congo · Guinea', label: 'Roots' },
      { value: 'Memory, carried', label: 'Vision' },
    ],
    descTitle: 'What we carry',
    desc: "The LES CERNES collection is born from a personal geography — Brussels, Port-au-Prince, Dakar, Conakry. Each piece assembles woven Fouta pagne, batik and vegetable leather, worked by hand. The parallel lines that run through every bag are not a pattern. They are roads. A tribute to Haiti — unreachable, yet always present. Maison Locht does not make fashion. It makes memory.",
    pillars: [
      { label: 'Craft', value: 'Hand-sewn, piece by piece' },
      { label: 'Uniqueness', value: 'Never reproduced, never repeated' },
      { label: 'Heritage', value: '3 continents woven into one piece' },
    ],
    photoCaption: 'Collection LOCHT 01 · LES CERNES',
    continues: 'Today, that road continues.',
    continuesLink: 'View the collection',
  },
}

function GoldRule() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })
  return (
    <motion.div
      ref={ref}
      className="w-12 h-px bg-gradient-to-r from-transparent via-[#b8965a] to-transparent"
      initial={{ scaleX: 0 }} animate={inView ? { scaleX: 1 } : {}}
      transition={{ duration: 0.9, ease }}
    />
  )
}

export default function Story() {
  const { lang } = useLang()
  const t = content[lang]
  const factsRef   = useRef<HTMLDivElement>(null)
  const factsInView = useInView(factsRef, { once: true, margin: '0px 0px -60px 0px' })
  const descRef    = useRef<HTMLDivElement>(null)
  const descInView = useInView(descRef, { once: true, margin: '0px 0px -60px 0px' })

  return (
    <section id="histoire">

      {/* ── Section bleue ── */}
      <div
        className="relative bg-[#043672] overflow-hidden py-16 px-8 md:px-14 flex flex-col items-center gap-8"
        data-theme="dark"
      >
        {/* Halos */}
        <div className="absolute -top-32 -right-32 w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(184,150,90,0.08)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.03)_0%,transparent_70%)] pointer-events-none" />
        {/* Texture grain */}
        <div className="absolute inset-0 opacity-[0.5] pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")` }} />
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}
          className="flex items-center gap-4 text-label text-[10px] text-[#b8965a] tracking-[6px] relative z-10"
        >
          <span className="text-[9px] opacity-70">✦</span>
          {t.eyebrow}
          <span className="text-[9px] opacity-70">✦</span>
        </motion.div>

        <GoldRule />

        {/* Facts */}
        <div ref={factsRef} className="flex flex-col md:flex-row items-center gap-6 md:gap-10 relative z-10 mt-2">
          {t.facts.map((fact, i) => (
            <div key={i} className="flex items-center gap-10">
              <motion.div
                className="flex flex-col items-center gap-1.5"
                initial={{ opacity: 0, y: 12 }}
                animate={factsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.12, ease }}
              >
                <span className="font-display text-[15px] font-light text-white/85 tracking-[2px]">{fact.value}</span>
                <span className="text-label text-[9px] text-[#b8965a]/80 tracking-[4px]">{fact.label}</span>
              </motion.div>
              {i < t.facts.length - 1 && (
                <span className="hidden md:block text-[#b8965a]/40 text-[10px]">✦</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Photo éditoriale plein-largeur ── */}
      <div className="relative w-full h-[55vw] max-h-[680px] min-h-[280px] overflow-hidden bg-[#021f45]">
        <Image
          src="/images/bottom.jpeg"
          alt="Maison Locht — Les Cernes"
          fill
          className="object-cover object-top"
          sizes="100vw"
        />
        {/* Voile gradient top/bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#043672]/40 via-transparent to-[#021f45]/50 pointer-events-none" />

        {/* Caption */}
        <motion.div
          className="absolute bottom-8 left-8 md:left-14"
          initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7, ease }}
        >
          <span className="text-label text-[10px] text-white/50 tracking-[4px]">{t.photoCaption}</span>
        </motion.div>
      </div>

      {/* ── Bande marque compacte ── */}
      <div ref={descRef} className="bg-[#faf7f2] border-b border-[#043672]/06 px-8 md:px-14 py-10">
        <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row md:items-center gap-6 md:gap-12">

          {/* Titre + texte court */}
          <motion.div
            className="flex-shrink-0 md:max-w-[340px]"
            initial={{ opacity: 0, y: 12 }} animate={descInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease }}
          >
            <h2 className="font-display text-[26px] md:text-[30px] font-light text-[#043672] leading-tight mb-2">{t.descTitle}</h2>
            <p className="text-[12px] leading-[1.85] text-[#7a7a8a] font-light">{t.desc}</p>
          </motion.div>

          <div className="hidden md:block w-px self-stretch bg-[#043672]/08 flex-shrink-0" />

          {/* Piliers inline */}
          <div className="flex flex-col md:flex-row md:items-start gap-5 md:gap-10 flex-1">
            {t.pillars.map((p, i) => (
              <motion.div
                key={i}
                className="flex flex-col gap-1"
                initial={{ opacity: 0, y: 8 }} animate={descInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.15 + i * 0.1, ease }}
              >
                <span className="text-label text-[9px] text-[#b8965a] tracking-[3px]">{p.label}</span>
                <span className="font-display text-[16px] font-light text-[#043672] leading-snug">{p.value}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Ouverture vers la suite ── */}
      <motion.div
        className="bg-[#faf7f2] border-b border-[#043672]/06 px-8 md:px-14 py-8 flex items-center justify-center gap-4"
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
        viewport={{ once: true }} transition={{ duration: 0.7, ease, delay: 0.1 }}
      >
        <p className="font-display text-[15px] italic font-light text-[#043672]/70">{t.continues}</p>
        <a href="#collection" className="text-label text-[9px] text-[#b8965a] tracking-[2px] hover:text-[#043672] transition-colors duration-200 flex items-center gap-1.5">
          {t.continuesLink} →
        </a>
      </motion.div>
    </section>
  )
}
