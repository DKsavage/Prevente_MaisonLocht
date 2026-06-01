'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from './LangContext'
import { useLenis } from './LenisProvider'
import { MODELS, pieceNum, fetchPieces, type DbPiece } from '@/lib/models'

const ease = [0.16, 1, 0.3, 1] as const

type Status = 'available' | 'reserved' | 'sold'
type Piece  = { id: string; src: string; status: Status; num: number }
type Model  = {
  id: string; name: string
  format: { fr: string; en: string }
  price: number; dims: string; count: number
  pieces: Piece[]
}

// Construit les modèles à partir des pièces DB + métadonnées
function buildModels(db: DbPiece[]): Model[] {
  return MODELS.map(m => {
    const pieces = db
      .filter(p => p.model === m.id)
      .map(p => ({ id: p.id, src: p.image_url, status: p.status as Status, num: pieceNum(p) }))
      .sort((a, b) => a.num - b.num)
    return {
      ...m,
      count: pieces.filter(p => p.status === 'available').length,
      pieces,
    }
  }).filter(m => m.pieces.length > 0)
}

const copy = {
  fr: {
    eyebrow: 'La Collection', title: 'LOCHT 01 · LES CERNES', limit: 'Max 2 par commande',
    unique: 'Pièce unique', order: 'Commander ce sac', reserved: 'Réservée',
    available: 'disponibles', details: 'Voir les détails', close: 'Fermer',
    materials: 'Matières', materialsVal: 'Cuir · Tissé fouta · Pagne',
    dimensions: 'Dimensions', format: 'Format', piece: 'Pièce',
    strip: [
      { label: 'Pièces uniques', sub: 'jamais reproduites' },
      { label: 'Canada uniquement', sub: 'livraison printemps 2026' },
      { label: 'Max 2 par commande', sub: 'cuir · tissé fouta · pagne' },
    ],
  },
  en: {
    eyebrow: 'The Collection', title: 'LOCHT 01 · LES CERNES', limit: 'Max 2 per order',
    unique: 'One-of-a-kind', order: 'Order this bag', reserved: 'Reserved',
    available: 'available', details: 'View details', close: 'Close',
    materials: 'Materials', materialsVal: 'Leather · Woven fouta · Pagne',
    dimensions: 'Dimensions', format: 'Size', piece: 'Piece',
    strip: [
      { label: 'Unique pieces', sub: 'never reproduced' },
      { label: 'Canada only', sub: 'spring 2026 delivery' },
      { label: 'Max 2 per order', sub: 'leather · woven fouta · pagne' },
    ],
  },
}

// ── Drawer ────────────────────────────────────────────────────
function BagDrawer({ piece, model, c, lang, onClose }: {
  piece: Piece; model: Model; c: typeof copy['fr']; lang: string; onClose: () => void
}) {
  const num = piece.num
  const { stop, start } = useLenis()

  useEffect(() => {
    stop()
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      start()
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [stop, start, onClose])

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      <motion.div
        className="absolute inset-0 bg-[#021f45]/60 backdrop-blur-[2px]"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        onClick={onClose}
      />
      <motion.div
        className="relative h-full w-full md:w-[460px] bg-[#faf7f2] flex flex-col overflow-y-auto overscroll-contain z-10"
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ duration: 0.5, ease }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-[#043672]/08 flex-shrink-0 sticky top-0 bg-[#faf7f2] z-10">
          <div>
            <p className="text-label text-[8px] text-[#b8965a] tracking-[4px]">{c.unique}</p>
            <p className="font-display text-[20px] font-light text-[#043672] mt-0.5">
              {model.name} <span className="text-[#7a7a8a] text-[15px]">N°{String(num).padStart(2, '0')}</span>
            </p>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center border border-[#043672]/15 hover:border-[#043672] text-[#7a7a8a] hover:text-[#043672] transition-all duration-200 text-xl" data-cursor="hover">×</button>
        </div>

        {/* Photo */}
        <div className="relative aspect-square w-full flex-shrink-0 bg-[#f0ebe0]">
          <Image src={piece.src} alt={`${model.name} N°${String(num).padStart(2, '0')}`} fill className="object-cover" sizes="460px" priority />
          {piece.status !== 'available' && (
            <div className="absolute inset-0 bg-[#043672]/55 flex items-center justify-center">
              <span className="text-label text-[11px] text-white/80 tracking-[5px] -rotate-12">
                {piece.status === 'sold' ? (lang === 'fr' ? 'Vendue' : 'Sold') : c.reserved}
              </span>
            </div>
          )}
        </div>

        {/* Détails */}
        <div className="flex flex-col gap-5 px-8 py-7">
          <div className="flex items-baseline justify-between border-b border-[#043672]/06 pb-5">
            <span className="font-display text-[34px] font-light text-[#043672]">{model.price}<span className="text-[16px] text-[#7a7a8a] ml-1">CAD</span></span>
            <span className="text-label text-[9px] text-[#7a7a8a] tracking-[2px]">{lang === 'fr' ? model.format.fr : model.format.en}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: c.dimensions, value: model.dims },
              { label: c.piece, value: `N°${String(num).padStart(2, '0')} / ${String(model.count).padStart(2, '0')}` },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-1.5">
                <span className="text-label text-[8px] text-[#b8965a] tracking-[3px]">{label}</span>
                <span className="text-[13px] text-[#043672] font-light">{value}</span>
              </div>
            ))}
          </div>

          <div className="bg-[#f0ebe0] px-5 py-4 flex flex-col gap-1.5">
            <span className="text-label text-[8px] text-[#b8965a] tracking-[3px]">{c.materials}</span>
            <span className="text-[12px] text-[#043672] font-light">{c.materialsVal}</span>
          </div>

          {piece.status === 'available' ? (
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('preselect-bag', {
                  detail: {
                    id: piece.id,
                    model: model.id,
                    modelName: model.name,
                    pieceNum: piece.num,
                    price: model.price,
                    src: piece.src,
                  }
                }))
                onClose()
                setTimeout(() => {
                  document.getElementById('commander')?.scrollIntoView({ behavior: 'smooth' })
                }, 350)
              }}
              className="group relative inline-flex items-center justify-between gap-3 bg-[#043672] text-white overflow-hidden px-6 py-4 w-full cursor-none"
              data-cursor="hover"
            >
              <span className="absolute inset-0 bg-[#0a4d9e] -translate-x-full group-hover:translate-x-0 transition-transform duration-[420ms] ease-[cubic-bezier(.16,1,.3,1)]" />
              <span className="relative text-label text-[9px] tracking-[3px]">{c.order}</span>
              <span className="relative text-sm group-hover:translate-x-1.5 transition-transform duration-300">→</span>
            </button>
          ) : (
            <div className="flex items-center justify-center px-6 py-4 border border-[#043672]/20 text-label text-[9px] text-[#7a7a8a] tracking-[3px]">
              {piece.status === 'sold' ? (lang === 'fr' ? 'Vendue' : 'Sold') : c.reserved}
            </div>
          )}

          <p className="text-label text-[8px] text-[#7a7a8a] tracking-[1px] text-center leading-relaxed">
            {lang === 'fr' ? 'Cette pièce est unique et ne sera jamais reproduite.' : 'This piece is one-of-a-kind and will never be reproduced.'}
          </p>
        </div>
      </motion.div>
    </div>
  )
}

// ── Spotlight par modèle ──────────────────────────────────────
function ModelSpotlight({ model, c, lang, onOpenDrawer, isFirst, index }: {
  model: Model; c: typeof copy['fr']; lang: string
  onOpenDrawer: (piece: Piece) => void; isFirst: boolean; index: number
}) {
  const firstAvailable = Math.max(0, model.pieces.findIndex(p => p.status === 'available'))
  const [active, setActive] = useState(firstAvailable)
  const isRare = model.count > 0 && model.count <= 3
  const activePiece = model.pieces[active]
  const isEven = index % 2 === 0

  return (
    <div className={`border-t-2 border-[#043672]/10 ${isEven ? 'bg-[#faf7f2]' : 'bg-[#ede8df]'}`}>
      <div className="grid md:grid-cols-2 min-h-[540px]">

        {/* ── Gauche : image full-bleed ── */}
        <div
          className="relative bg-[#f0ebe0] overflow-hidden cursor-none min-h-[360px] md:min-h-0"
          data-cursor="hover"
          onClick={() => onOpenDrawer(activePiece)}
        >
          {/* Préchargement de toutes les images — instante au switch */}
          {model.pieces.map((piece, i) => (
            <div
              key={piece.id}
              className="absolute inset-0 transition-opacity duration-500 ease-[cubic-bezier(.4,0,.2,1)]"
              style={{ opacity: i === active ? 1 : 0, zIndex: i === active ? 1 : 0 }}
            >
              <Image
                src={piece.src}
                alt={`${model.name} N°${String(i + 1).padStart(2, '0')}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={i === 0 && isFirst}
              />
            </div>
          ))}

          {/* Compteur */}
          <div className="absolute top-5 left-5 z-10 bg-[#faf7f2]/80 backdrop-blur-sm px-3 py-1.5 flex items-center gap-2">
            <span className="font-display text-[14px] text-[#043672]">{String(active + 1).padStart(2, '0')}</span>
            <span className="text-[#7a7a8a] text-[10px]">/</span>
            <span className="text-label text-[10px] text-[#7a7a8a]">{String(model.pieces.length).padStart(2, '0')}</span>
          </div>

          {/* Tag */}
          <div className="absolute bottom-5 left-5 z-10 bg-[#faf7f2]/85 backdrop-blur-sm px-3 py-1.5">
            <span className="text-label text-[7px] text-[#043672] tracking-[2px]">
              {activePiece.status === 'available' ? c.unique : (activePiece.status === 'sold' ? (lang === 'fr' ? 'Vendue' : 'Sold') : c.reserved)} · N°{String(activePiece.num).padStart(2, '0')}
            </span>
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 z-10 bg-[#043672]/0 hover:bg-[#043672]/70 transition-colors duration-500 flex items-center justify-center group">
            <span className="text-label text-[9px] text-transparent group-hover:text-white tracking-[3px] translate-y-2 group-hover:translate-y-0 transition-all duration-300">
              {c.details} →
            </span>
          </div>
        </div>

        {/* ── Droite : info + thumbnails ── */}
        <div className={`flex flex-col justify-center gap-6 px-10 md:px-14 py-12 ${isEven ? 'bg-[#faf7f2]' : 'bg-[#ede8df]'}`}>

          <motion.div className="flex flex-col gap-2"
            initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7, ease }}>
            <span className="text-label text-[8px] text-[#b8965a] tracking-[5px]">
              {lang === 'fr' ? model.format.fr : model.format.en}
            </span>
            <h3 className="font-display text-[48px] md:text-[56px] font-light text-[#043672] leading-none tracking-tight">
              {model.name}
            </h3>
            <p className="text-label text-[9px] text-[#7a7a8a] tracking-[2px] mt-1">{model.dims}</p>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#043672]/06">
              <span className="font-display text-[32px] font-light text-[#043672]">
                {model.price} <span className="text-[16px] text-[#7a7a8a]">CAD</span>
              </span>
              <span className={`flex items-center gap-1.5 text-label text-[8px] tracking-[2px] ${model.count === 0 ? 'text-[#7a7a8a]' : isRare ? 'text-[#b8965a]' : 'text-[#7a7a8a]'}`}>
                {isRare && model.count > 0 && <span className="w-1.5 h-1.5 rounded-full bg-[#b8965a]" style={{ animation: 'urgency-pulse 1.8s ease-in-out infinite' }} />}
                {model.count === 0 ? (lang === 'fr' ? 'Épuisé' : 'Sold out') : `${model.count} ${c.available}`}
              </span>
            </div>
          </motion.div>

          {/* Thumbnails */}
          <div className="grid grid-cols-4 gap-2">
            {model.pieces.map((piece, i) => {
              const taken = piece.status !== 'available'
              return (
                <motion.button
                  key={piece.id}
                  onClick={() => setActive(i)}
                  className="relative aspect-square overflow-hidden transition-all duration-200 cursor-none"
                  style={{ outline: i === active ? '2px solid #b8965a' : '2px solid transparent', outlineOffset: '2px' }}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
                  initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.05, ease }}
                  data-cursor="hover"
                >
                  <Image src={piece.src} alt="" fill className="object-cover" sizes="80px" style={{ filter: taken ? 'grayscale(1)' : 'none', opacity: taken ? 0.45 : 1 }} />
                  {taken && (
                    <span className="absolute inset-0 flex items-center justify-center bg-[#043672]/20">
                      <span className="w-3 h-3 rounded-full bg-[#faf7f2]/80 flex items-center justify-center text-[6px] text-[#043672]">●</span>
                    </span>
                  )}
                </motion.button>
              )
            })}
          </div>

          {/* CTA */}
          <button
            onClick={() => onOpenDrawer(activePiece)}
            className="group relative inline-flex items-center justify-between bg-[#043672] text-white overflow-hidden px-6 py-4"
            data-cursor="hover"
          >
            <span className="absolute inset-0 bg-[#0a4d9e] -translate-x-full group-hover:translate-x-0 transition-transform duration-[420ms] ease-[cubic-bezier(.16,1,.3,1)]" />
            <span className="relative text-label text-[9px] tracking-[3px]">{c.details}</span>
            <span className="relative text-sm group-hover:translate-x-1.5 transition-transform duration-300">→</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Section principale ────────────────────────────────────────
export default function Collection() {
  const { lang } = useLang()
  const c = copy[lang]
  const [drawer, setDrawer] = useState<{ piece: Piece; model: Model } | null>(null)
  const [models, setModels] = useState<Model[]>([])

  useEffect(() => {
    fetchPieces().then(db => setModels(buildModels(db)))
  }, [])

  return (
    <section id="collection" className="bg-[#faf7f2]">

      {/* Strip */}
      <div className="bg-[#b8965a]/08 border-y border-[#b8965a]/15 py-4 px-8 md:px-14">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
          {c.strip.map((item, i) => (
            <div key={i} className="flex items-center gap-12">
              <div className="text-center md:text-left">
                <span className="text-label text-[9px] text-[#043672] tracking-[3px] block">{item.label}</span>
                <span className="text-label text-[8px] text-[#7a7a8a] tracking-[2px] block mt-0.5">{item.sub}</span>
              </div>
              {i < c.strip.length - 1 && <div className="hidden md:block w-px h-6 bg-[#043672]/12" />}
            </div>
          ))}
        </div>
      </div>

      {/* En-tête */}
      <motion.div
        className="px-8 md:px-14 pt-14 pb-2 flex flex-col md:flex-row md:items-end md:justify-between gap-4"
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.8, ease }}
      >
        <div>
          <p className="text-label text-[9px] text-[#b8965a] tracking-[5px] mb-3">{c.eyebrow}</p>
          <h2 className="font-display text-[36px] md:text-[44px] font-light text-[#043672] tracking-[4px]">{c.title}</h2>
        </div>
        <span className="text-label text-[9px] text-[#b8965a] tracking-[2px] border border-[#b8965a]/30 px-4 py-2 self-start">{c.limit}</span>
      </motion.div>

      {models.map((model, i) => (
        <ModelSpotlight key={model.id} model={model} c={c} lang={lang} isFirst={i === 0} index={i}
          onOpenDrawer={(piece) => setDrawer({ piece, model })} />
      ))}

      <AnimatePresence>
        {drawer && (
          <BagDrawer piece={drawer.piece} model={drawer.model} c={c} lang={lang} onClose={() => setDrawer(null)} />
        )}
      </AnimatePresence>
    </section>
  )
}
