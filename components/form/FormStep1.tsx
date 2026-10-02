'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { OrderFormData } from '@/lib/schemas'
import { MODELS, getModel, pieceNum, fetchPieces, type DbPiece, type ModelId, type PieceStatus } from '@/lib/models'

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
    sub: 'Sélectionnez jusqu\'à 2 pièces. Chaque sac est une pièce unique ; chaque casquette fait partie d\'une édition limitée de 10 exemplaires.',
    selected: 'sélectionnée', selectedPlural: 'sélectionnées',
    max: 'Maximum atteint — 2 pièces par commande',
    remove: 'Retirer',
    total: 'Total', next: 'Continuer',
    unique: 'Pièce unique',
    selectHint: 'Cliquer pour sélectionner',
    emptyHint: 'Aucune pièce sélectionnée',
    rare: 'disponibles',
    limitedEdition: 'Édition limitée',
    editionOf: '10 exemplaires',
    soldOut: 'Épuisé',
  },
  en: {
    title: 'Choose your pieces',
    sub: 'Select up to 2 pieces. Each bag is one-of-a-kind; each cap is part of a limited edition of 10.',
    selected: 'selected', selectedPlural: 'selected',
    max: 'Maximum reached — 2 pieces per order',
    remove: 'Remove',
    total: 'Total', next: 'Continue',
    unique: 'One-of-a-kind',
    selectHint: 'Click to select',
    emptyHint: 'No pieces selected',
    rare: 'available',
    limitedEdition: 'Limited edition',
    editionOf: '10 pieces',
    soldOut: 'Sold out',
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
        id: p.id, model: p.model, modelName: m.colorLabel ? `${m.name} · ${m.colorLabel.fr}` : m.name,
        pieceNum: pieceNum(p), price: m.price, src: p.image_url,
        status: p.status,
      }))
      .sort((a, b) => a.pieceNum - b.pieceNum),
  })).filter(g => g.pieces.length > 0)

  // Regroupe les variantes couleur (ex. les 4 Lucao) sous un même en-tête
  type GroupEntry = typeof grouped[number]
  const sections: ({ kind: 'bag'; group: GroupEntry } | { kind: 'cap'; groupName: string; variants: GroupEntry[] })[] = []
  for (const g of grouped) {
    if (!g.meta.groupName) { sections.push({ kind: 'bag', group: g }); continue }
    const existing = sections.find(s => s.kind === 'cap' && s.groupName === g.meta.groupName) as Extract<typeof sections[number], { kind: 'cap' }> | undefined
    if (existing) existing.variants.push(g)
    else sections.push({ kind: 'cap', groupName: g.meta.groupName, variants: [g] })
  }

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

  // Sélectionne/désélectionne une couleur de casquette (pas une unité précise)
  const selectedForModel = (modelId: ModelId) => selections.find(s => s.model === modelId)
  const pickColor = (variant: GroupEntry) => {
    const existing = selectedForModel(variant.meta.id)
    if (existing) { toggle(existing); return }
    const avail = variant.pieces.find(p => p.status === 'available')
    if (avail && !isFull) toggle(avail)
  }

  const pieceLabel = (p: SelectedPiece) => {
    const isCap = getModel(p.model)?.category === 'cap'
    return isCap ? p.modelName : `${p.modelName} N°${String(p.pieceNum).padStart(2, '0')}`
  }

  const syncFormData = (next: SelectedPiece[]) => {
    if (next.length === 0) {
      onChange({ bagModel: undefined, bagName: undefined, quantity: 1, priceTotal: undefined })
      return
    }
    const total = next.reduce((s, p) => s + p.price, 0)
    const names = next.map(p => pieceLabel(p)).join(' · ')
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
        {sections.map((section, mi) => section.kind === 'bag' ? (
          <BagGroup key={section.group.meta.id} meta={section.group.meta} pieces={section.group.pieces}
            mi={mi} lang={lang} t={t} isSelected={isSelected} isFull={isFull} toggle={toggle} />
        ) : (
          <CapGroup key={section.groupName} groupName={section.groupName} variants={section.variants}
            lang={lang} t={t} selectedForModel={selectedForModel} pickColor={pickColor} isFull={isFull} />
        ))}
      </div>

      {/* Résumé sélection */}
      {selections.length > 0 && (
        <motion.div
          className="flex flex-col gap-3 p-5 bg-[#f0ebe0] border-t-2 border-[#b8965a]/30"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
        >
          {selections.map((p) => (
            <div key={p.id} className="flex items-center gap-3">
              <div className="relative w-12 h-12 flex-shrink-0 bg-[#e0dbd3]">
                <Image src={p.src} alt={p.modelName} fill className="object-cover" sizes="48px" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-display text-[16px] font-light text-[#043672] block leading-none">
                  {p.modelName}
                </span>
                <span className="text-label text-[10px] text-[#7a7a8a] tracking-[2px]">
                  {pieceLabel(p) === p.modelName ? t.editionOf : `N°${String(p.pieceNum).padStart(2, '0')}`} · {p.price} CAD
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

type Copy = typeof copy['fr']
type GroupMeta = typeof MODELS[number]

// ── Groupe sac — grille de pièces uniques numérotées (inchangé) ──
function BagGroup({ meta, pieces, mi, lang, t, isSelected, isFull, toggle }: {
  meta: GroupMeta; pieces: GridPiece[]; mi: number; lang: 'fr' | 'en'; t: Copy
  isSelected: (id: string) => boolean; isFull: boolean; toggle: (p: SelectedPiece) => void
}) {
  const available = pieces.filter(p => p.status === 'available').length
  const isRare = available > 0 && available <= 3
  return (
    <div>
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
}

// ── Groupe casquette — swatches couleur, pas de numérotation ──
function CapGroup({ groupName, variants, lang, t, selectedForModel, pickColor, isFull }: {
  groupName: string; variants: { meta: GroupMeta; pieces: GridPiece[] }[]
  lang: 'fr' | 'en'; t: Copy
  selectedForModel: (id: ModelId) => SelectedPiece | undefined
  pickColor: (v: { meta: GroupMeta; pieces: GridPiece[] }) => void
  isFull: boolean
}) {
  const totalAvailable = variants.reduce((s, v) => s + v.pieces.filter(p => p.status === 'available').length, 0)
  const price = variants[0].meta.price
  return (
    <div>
      <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-[#043672]/08">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-[20px] font-light text-[#043672]">{groupName}</span>
          <span className="text-label text-[10px] text-[#7a7a8a] tracking-[2px]">{t.limitedEdition}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-label text-[10px] text-[#7a7a8a] tracking-[2px]">
            {totalAvailable === 0 ? t.soldOut : `${totalAvailable} ${t.rare}`}
          </span>
          <span className="font-display text-[16px] font-light text-[#043672]">
            {price} <span className="text-[11px] text-[#7a7a8a]">CAD</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        {variants.map(v => {
          const available = v.pieces.filter(p => p.status === 'available').length
          const soldOut = available === 0
          const sel = !!selectedForModel(v.meta.id)
          const disabled = soldOut || (isFull && !sel)
          return (
            <button key={v.meta.id} onClick={() => !disabled && pickColor(v)} disabled={disabled}
              className={`flex flex-col items-center gap-1.5 cursor-none ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
              data-cursor="hover"
            >
              <span className="relative w-10 h-10 rounded-full block transition-all duration-200"
                style={{
                  background: v.meta.colorSwatch ?? '#ccc',
                  outline: sel ? '2px solid #b8965a' : '2px solid transparent',
                  outlineOffset: '2px',
                }}
              >
                {sel && (
                  <span className="absolute inset-0 flex items-center justify-center text-white text-[12px]">✓</span>
                )}
              </span>
              <span className="text-label text-[9px] text-[#7a7a8a] tracking-[1px]">
                {soldOut ? t.soldOut : (v.meta.colorLabel ? (lang === 'fr' ? v.meta.colorLabel.fr : v.meta.colorLabel.en) : '')}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
