'use client'

import Image from 'next/image'
import { useState, useTransition } from 'react'
import { setPieceStatus, releasePiece, reassignPiece } from '@/app/admin/actions'
import { pieceNum } from '@/lib/models'

export type InvPiece = {
  id: string
  model: string
  image_url: string
  status: 'available' | 'reserved' | 'sold'
  order_ref: string | null
  sort_order: number
  display_num: number | null
  orderPending?: boolean
}

const MODELS = [
  { id: 'kouna', name: 'Le Kouna' },
  { id: 'kami', name: 'Le Kami' },
  { id: 'nafibe', name: 'Le Nafibe' },
]
const MODEL_NAMES: Record<string, string> = { kouna: 'Le Kouna', kami: 'Le Kami', nafibe: 'Le Nafibe' }

function statusInfo(p: InvPiece) {
  if (p.status === 'available') return { label: 'Disponible', cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
  if (p.status === 'sold')      return { label: 'Vendue', cls: 'text-[#043672] bg-[#043672]/10 border-[#043672]/20' }
  // reserved
  if (p.orderPending) return { label: 'En attente paiement', cls: 'text-[#9a7a3a] bg-[#b8965a]/15 border-[#b8965a]/40' }
  return { label: 'Réservée', cls: 'text-[#9a7a3a] bg-[#b8965a]/10 border-[#b8965a]/25' }
}

export default function InventoryGrid({ pieces }: { pieces: InvPiece[] }) {
  return (
    <div className="flex flex-col gap-10">
      {MODELS.map(model => {
        const list = pieces.filter(p => p.model === model.id)
        const c = {
          available: list.filter(p => p.status === 'available').length,
          reserved: list.filter(p => p.status === 'reserved').length,
          sold: list.filter(p => p.status === 'sold').length,
        }
        return (
          <div key={model.id}>
            <div className="flex items-baseline justify-between mb-4 pb-2 border-b border-[#043672]/10">
              <h2 className="font-display text-[22px] font-light text-[#043672]">{model.name}</h2>
              <span className="text-label text-[8px] text-[#7a7a8a] tracking-[2px]">
                {list.length} pièces · {c.available} dispo · {c.reserved} réservées · {c.sold} vendues
              </span>
            </div>
            {list.length === 0 ? (
              <p className="text-[12px] text-[#7a7a8a] font-light">Aucune pièce dans ce modèle.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {list.map(piece => <PieceCard key={piece.id} piece={piece} />)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function PieceCard({ piece }: { piece: InvPiece }) {
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [model, setModel] = useState(piece.model)
  const [num, setNum] = useState(String(pieceNum(piece)))
  const info = statusInfo(piece)
  const displayN = pieceNum(piece)

  const act = (fn: () => Promise<void>) => startTransition(async () => { await fn() })

  const saveReassign = () => act(async () => {
    await reassignPiece(piece.id, model as 'kouna' | 'kami' | 'nafibe', parseInt(num, 10) || 1)
    setEditing(false)
  })

  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-square overflow-hidden border border-[#043672]/10 bg-[#f0ebe0]">
        <Image src={piece.image_url} alt={piece.id} fill className="object-cover"
          style={{ filter: piece.status === 'sold' ? 'grayscale(0.6)' : 'none' }} sizes="160px" />
        <div className="absolute top-2 left-2 bg-[#faf7f2]/90 px-2 py-0.5">
          <span className="text-label text-[7px] text-[#043672] tracking-[1px]">N°{String(displayN).padStart(2, '0')}</span>
        </div>
        <button onClick={() => setEditing(e => !e)}
          className="absolute top-2 right-2 bg-[#043672]/80 text-white text-[9px] w-5 h-5 flex items-center justify-center hover:bg-[#043672]">
          ✎
        </button>
      </div>

      <span className={`text-label text-[7px] tracking-[1px] px-2 py-1 border text-center ${info.cls}`}>
        {info.label}
      </span>

      {/* Édition réassignation */}
      {editing && (
        <div className="flex flex-col gap-1.5 p-2 bg-[#f0ebe0] border border-[#b8965a]/30">
          <select value={model} onChange={e => setModel(e.target.value)}
            className="text-[10px] border border-[#043672]/20 px-1.5 py-1 bg-white">
            {MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <div className="flex gap-1 items-center">
            <span className="text-[8px] text-[#7a7a8a]">N°</span>
            <input type="number" min={1} value={num} onChange={e => setNum(e.target.value)}
              className="w-12 text-[10px] border border-[#043672]/20 px-1.5 py-1 bg-white" />
            <button onClick={saveReassign} disabled={isPending}
              className="flex-1 text-label text-[7px] tracking-[1px] px-1 py-1 bg-[#043672] text-white disabled:opacity-50">
              Enregistrer
            </button>
          </div>
        </div>
      )}

      {/* Actions statut */}
      {!editing && (
        <div className="flex gap-1">
          {piece.status !== 'available' && (
            <button onClick={() => act(() => releasePiece(piece.id))} disabled={isPending}
              className="flex-1 text-label text-[6px] tracking-[1px] px-1 py-1.5 border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-50">
              Libérer
            </button>
          )}
          {piece.status !== 'sold' && (
            <button onClick={() => act(() => setPieceStatus(piece.id, 'sold'))} disabled={isPending}
              className="flex-1 text-label text-[6px] tracking-[1px] px-1 py-1.5 border border-[#043672]/20 text-[#043672] hover:bg-[#043672] hover:text-white transition-colors disabled:opacity-50">
              Vendue
            </button>
          )}
        </div>
      )}
      {piece.order_ref && <span className="text-[8px] text-[#7a7a8a] font-mono text-center">{piece.order_ref}</span>}
    </div>
  )
}
