'use client'

import Image from 'next/image'
import { useState, useTransition } from 'react'
import { setPieceStatus, releasePiece } from '@/app/admin/actions'

export type InvPiece = {
  id: string
  model: string
  image_url: string
  status: 'available' | 'reserved' | 'sold'
  order_ref: string | null
  sort_order: number
}

const MODEL_NAMES: Record<string, string> = { kouna: 'Le Kouna', kami: 'Le Kami', nafibe: 'Le Nafibe' }
const STATUS_LABELS = { available: 'Disponible', reserved: 'Réservée', sold: 'Vendue' }
const STATUS_COLORS = {
  available: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  reserved: 'text-[#9a7a3a] bg-[#b8965a]/15 border-[#b8965a]/30',
  sold: 'text-[#043672] bg-[#043672]/10 border-[#043672]/20',
}

export default function InventoryGrid({ pieces }: { pieces: InvPiece[] }) {
  const models = ['kouna', 'kami', 'nafibe']
  const counts = (m: string) => {
    const ps = pieces.filter(p => p.model === m)
    return {
      total: ps.length,
      available: ps.filter(p => p.status === 'available').length,
      reserved: ps.filter(p => p.status === 'reserved').length,
      sold: ps.filter(p => p.status === 'sold').length,
    }
  }

  return (
    <div className="flex flex-col gap-10">
      {models.map(model => {
        const list = pieces.filter(p => p.model === model)
        if (list.length === 0) return null
        const c = counts(model)
        return (
          <div key={model}>
            <div className="flex items-baseline justify-between mb-4 pb-2 border-b border-[#043672]/10">
              <h2 className="font-display text-[22px] font-light text-[#043672]">{MODEL_NAMES[model] ?? model}</h2>
              <span className="text-label text-[8px] text-[#7a7a8a] tracking-[2px]">
                {c.available} dispo · {c.reserved} réservées · {c.sold} vendues
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {list.map(piece => <PieceCard key={piece.id} piece={piece} />)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PieceCard({ piece }: { piece: InvPiece }) {
  const [isPending, startTransition] = useTransition()
  const num = piece.id.match(/-(\d+)$/)?.[1] ?? ''

  const setStatus = (status: InvPiece['status']) => {
    startTransition(async () => { await setPieceStatus(piece.id, status) })
  }
  const release = () => {
    startTransition(async () => { await releasePiece(piece.id) })
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-square overflow-hidden border border-[#043672]/10 bg-[#f0ebe0]">
        <Image src={piece.image_url} alt={piece.id} fill className="object-cover"
          style={{ filter: piece.status === 'sold' ? 'grayscale(0.6)' : 'none' }} sizes="160px" />
        <div className="absolute top-2 left-2 bg-[#faf7f2]/90 px-2 py-0.5">
          <span className="text-label text-[7px] text-[#043672] tracking-[1px]">N°{num}</span>
        </div>
      </div>

      <span className={`text-label text-[7px] tracking-[1px] px-2 py-1 border text-center ${STATUS_COLORS[piece.status]}`}>
        {STATUS_LABELS[piece.status]}
      </span>

      {/* Actions rapides */}
      <div className="flex gap-1">
        {piece.status !== 'available' && (
          <button onClick={release} disabled={isPending}
            className="flex-1 text-label text-[6px] tracking-[1px] px-1 py-1.5 border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-50">
            Libérer
          </button>
        )}
        {piece.status !== 'sold' && (
          <button onClick={() => setStatus('sold')} disabled={isPending}
            className="flex-1 text-label text-[6px] tracking-[1px] px-1 py-1.5 border border-[#043672]/20 text-[#043672] hover:bg-[#043672] hover:text-white transition-colors disabled:opacity-50">
            Vendue
          </button>
        )}
      </div>
      {piece.order_ref && <span className="text-[8px] text-[#7a7a8a] font-mono text-center">{piece.order_ref}</span>}
    </div>
  )
}
