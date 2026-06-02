'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { OrderFormData } from '@/lib/schemas'
import { MODELS, pieceNum, fetchPieces, type DbPiece, type ModelId, type PieceStatus } from '@/lib/models'

const ease = [0.16, 1, 0.3, 1] as const

// ── Données ──────────────────────────────────────────────────
export type SelectedPiece = {
  id: string
  model: ModelId
  modelName: string
  pieceNum: number
  price: number
  src: string
}

type GridPiece = SelectedPiece & { status: PieceStatus }

// ── Copy ────────────────────────────────────────────────────
const copy = {
  fr: {
    title: 'Choisissez vos pièces',
    sub: 'Sélectionnez jusqu\'à 2 pièces. Chaque pièce est unique et ne sera jamais reproduite.',
    selected: 'sélectionnée', selectedPlural: 'sélectionnées',
    max: 'Maximum atteint — 2 pièces par commande',
    remove: 'Retirer',
    total: 'Total', next: 'Continuer',
    unique: 'Pièce unique',
    selectHint: 'Cliquer pour sélectionner',
    emptyHint: 'Aucune pièce sélectionnée',
    rare: 'disponibles',
  },
  en: {
    title: 'Choose your pieces',
    sub: 'Select up to 2 pieces. Each piece is one-of-a-kind and will never be reproduced.',
    selected: 'selected', selectedPlural: 'selected',
    max: 'Maximum reached — 2 pieces per order',
    remove: 'Remove',
    total: 'Total', next: 'Continue',
    unique: 'One-of-a-kind',
    selectHint: 'Click to select',
    emptyHint: 'No pieces selected',
    rare: 'available',
  },
}

// ── Props ────────────────────────────────────────────────────
type Props = {
  data: Partial<OrderFormData>
  selections: SelectedPiece[]
  lang: 'fr' | 'en'
  onChange: (d: Partial<OrderFormData>) => void
  onSelectionsChange: (s: SelectedPiece[]) => void
  onNext: () => void
}

export default function FormStep1({ data, selections, lang, onChange, onSelectionsChange, onNext }: Props) {
  const t = copy[lang]
  const MAX = 2

  // Pièces depuis la DB (statut réel)
  const [dbPieces, setDbPieces] = useState<DbPiece[]>([])
  useEffect(() => { fetchPieces().then(setDbPieces) }, [])

  // Groupées par modèle, dans l'ordre des MODELS
  const grouped = MODELS.map(m => ({
    meta: m,
    pieces: dbPieces
      .filter(p => p.model === m.id)
      .map<GridPiece>(p => ({
        id: p.id, model: p.model, modelName: m.name,
        pieceNum: pieceNum(p), price: m.price, src: p.image_url,
        status: p.status,
      }))
      .sort((a, b) => a.pieceNum - b.pieceNum),
  })).filter(g => g.pieces.length > 0)

  const isSelected   = (id: string) => selections.some(s => s.id === id)
  const isFull       = selections.length >= MAX

  const toggle = (piece: SelectedPiece) => {
    if (isSelected(piece.id)) {
      const next = selections.filter(s => s.id !== piece.id)
      onSelectionsChange(next)
      syncFormData(next)
    } else if (!isFull) {
      const next = [...selections, piece]
      onSelectionsChange(next)
      syncFormData(next)
    }
  }

  const syncFormData = (next: SelectedPiece[]) => {
    if (next.length === 0) {
      onChange({ bagModel: undefined, bagName: undefined, quantity: 1, priceTotal: undefined })
      return
    }
    const total = next.reduce((s, p) => s + p.price, 0)
    const names = next.map(p => `${p.modelName} N°${String(p.pieceNum).padStart(2, '0')}`).join(' · ')
    onChange({
      bagModel: next[0].model,
      bagName: names,
      quantity: next.length as 1 | 2,
      priceTotal: total,
    })
  }

  const canContinue = selections.length >= 1

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="font-display text-[28px] md:text-[34px] font-light text-[#043672] mb-1">{t.title}</h3>
        <p className="text-[12px] text-[#7a7a8a] font-light">{t.sub}</p>
      </div>

      {/* Compteur sélection */}
      <div className="flex items-center gap-3">
        {[0, 1].map(i => (
          <div
            key={i}
            className={`w-8 h-8 border-2 flex items-center justify-center transition-all duration-300 ${
              selections[i] ? 'border-[#b8965a] bg-[#b8965a]/10' : 'border-[#043672]/15'
            }`}
          >
            {selections[i] && <span className="text-[#b8965a] text-[11px]">✓</span>}
          </div>
        ))}
        <span className="text-label text-[9px] tracking-[3px] text-[#7a7a8a]">
          {selections.length}/{MAX}
          {' '}
          {selections.length === 1 ? t.selected : t.selectedPlural}
        </span>
        {isFull && (
          <motion.span
            initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
            className="text-label text-[10px] text-[#b8965a] tracking-[2px]"
          >
            {t.max}
          </motion.span>
        )}
      </div>

      {/* Pièces par modèle */}
      <div className="flex flex-col gap-8">
        {grouped.map(({ meta, pieces }, mi) => {
          const available = pieces.filter(p => p.status === 'available').length
          const isRare = available > 0 && available <= 3
          return (
            <div key={meta.id}>
              {/* En-tête modèle */}
              <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-[#043672]/08">
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-[20px] font-light text-[#043672]">{meta.name}</span>
                  <span className="text-label text-[10px] text-[#7a7a8a] tracking-[2px]">
                    {lang === 'fr' ? meta.format.fr : meta.format.en}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {isRare && (
                    <span className="flex items-center gap-1.5 text-label text-[10px] text-[#b8965a] tracking-[2px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#b8965a]" style={{ animation: 'urgency-pulse 1.8s ease-in-out infinite' }} />
                      {available} {t.rare}
                    </span>
                  )}
                  <span className="font-display text-[16px] font-light text-[#043672]">
                    {meta.price} <span className="text-[11px] text-[#7a7a8a]">CAD</span>
                  </span>
                </div>
              </div>

              {/* Grille de pièces */}
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {pieces.map((piece, pi) => {
                  const sel = isSelected(piece.id)
                  const taken = piece.status !== 'available'
                  const disabled = taken || (isFull && !sel)
                  return (
                    <motion.button
                      key={piece.id}
                      onClick={() => !taken && toggle(piece)}
                      disabled={disabled}
                      className={`relative aspect-square overflow-hidden cursor-none transition-all duration-200 ${
                        sel ? 'ring-2 ring-[#b8965a] ring-offset-1' : 'ring-0'
                      } ${disabled ? 'cursor-not-allowed' : 'hover:opacity-90'}`}
                      whileHover={!disabled ? { scale: 1.05 } : {}}
                      whileTap={!disabled ? { scale: 0.96 } : {}}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: taken ? 0.4 : (isFull && !sel ? 0.35 : 1), y: 0 }}
                      transition={{ duration: 0.3, delay: (mi * 8 + pi) * 0.02, ease }}
                      data-cursor="hover"
                      title={`${piece.modelName} N°${String(piece.pieceNum).padStart(2, '0')}`}
                    >
                      <Image
                        src={piece.src} alt={`${piece.modelName} N°${String(piece.pieceNum).padStart(2, '0')}`}
                        fill className="object-cover" sizes="80px"
                        style={{ filter: taken ? 'grayscale(1)' : 'none' }}
                      />
                      {/* Overlay sélectionné */}
                      {sel && (
                        <div className="absolute inset-0 bg-[#b8965a]/30 flex items-center justify-center">
                          <span className="w-5 h-5 bg-[#b8965a] flex items-center justify-center text-white text-[10px]">✓</span>
                        </div>
                      )}
                      {/* Overlay indisponible */}
                      {taken && (
                        <div className="absolute inset-0 bg-[#043672]/35 flex items-center justify-center">
                          <span className="text-[6px] text-white/90 tracking-[1px] uppercase -rotate-12">
                            {piece.status === 'sold' ? (lang === 'fr' ? 'Vendue' : 'Sold') : (lang === 'fr' ? 'Réservée' : 'Reserved')}
                          </span>
                        </div>
                      )}
                      {/* Numéro */}
                      {!taken && (
                        <div className="absolute bottom-0 left-0 right-0 bg-[#043672]/60 py-0.5 text-center">
                          <span className="text-[9px] text-white/70">N°{String(piece.pieceNum).padStart(2, '0')}</span>
                        </div>
                      )}
                    </motion.button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Résumé sélection */}
      {selections.length > 0 && (
        <motion.div
          className="flex flex-col gap-3 p-5 bg-[#f0ebe0] border-t-2 border-[#b8965a]/30"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
        >
          {selections.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3">
              <div className="relative w-12 h-12 flex-shrink-0 bg-[#e0dbd3]">
                <Image src={p.src} alt={p.modelName} fill className="object-cover" sizes="48px" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-display text-[16px] font-light text-[#043672] block leading-none">
                  {p.modelName}
                </span>
                <span className="text-label text-[10px] text-[#7a7a8a] tracking-[2px]">
                  N°{String(p.pieceNum).padStart(2, '0')} · {p.price} CAD
                </span>
              </div>
              <button
                onClick={() => toggle(p)}
                className="text-label text-[10px] text-[#7a7a8a] tracking-[2px] hover:text-red-400 transition-colors duration-200 cursor-none flex-shrink-0"
                data-cursor="hover"
              >
                ×
              </button>
            </div>
          ))}

          <div className="flex justify-between items-baseline pt-3 border-t border-[#043672]/10 mt-1">
            <span className="text-label text-[9px] text-[#7a7a8a] tracking-[3px]">{t.total}</span>
            <span className="font-display text-[24px] font-light text-[#043672]">
              {selections.reduce((s, p) => s + p.price, 0)} <span className="text-[13px] text-[#7a7a8a]">CAD</span>
            </span>
          </div>
        </motion.div>
      )}

      {/* CTA */}
      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!canContinue}
          className="group relative inline-flex items-center gap-4 bg-[#043672] text-white overflow-hidden px-8 py-4 disabled:opacity-40 disabled:cursor-not-allowed cursor-none"
          data-cursor="hover"
        >
          <span className="absolute inset-0 bg-[#0a4d9e] -translate-x-full group-hover:translate-x-0 transition-transform duration-[420ms] ease-[cubic-bezier(.16,1,.3,1)] group-disabled:hidden" />
          <span className="relative text-label text-[9px] tracking-[3px]">
            {lang === 'fr' ? 'Continuer' : 'Continue'}
          </span>
          <span className="relative text-sm group-hover:translate-x-1.5 transition-transform duration-300">→</span>
        </button>
      </div>
    </div>
  )
}
