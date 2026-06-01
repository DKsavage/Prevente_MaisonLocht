'use client'

import Image from 'next/image'
import { useState, useRef, useTransition } from 'react'
import { setPieceStatus, releasePiece, reassignPiece, addPiece, changePieceImage, deletePiece } from '@/app/admin/actions'
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

function statusInfo(p: InvPiece) {
  if (p.status === 'available') return { label: 'Disponible', dot: 'bg-emerald-500', cls: 'text-emerald-700 bg-emerald-50' }
  if (p.status === 'sold')      return { label: 'Vendue', dot: 'bg-[#043672]', cls: 'text-[#043672] bg-[#043672]/08' }
  if (p.orderPending)           return { label: 'En attente paiement', dot: 'bg-[#b8965a]', cls: 'text-[#9a7a3a] bg-[#b8965a]/12' }
  return { label: 'Réservée', dot: 'bg-[#b8965a]/60', cls: 'text-[#9a7a3a] bg-[#b8965a]/08' }
}

export default function InventoryGrid({ pieces }: { pieces: InvPiece[] }) {
  return (
    <div className="flex flex-col gap-12">
      {MODELS.map(model => {
        const list = pieces.filter(p => p.model === model.id)
        const c = {
          available: list.filter(p => p.status === 'available').length,
          reserved: list.filter(p => p.status === 'reserved').length,
          sold: list.filter(p => p.status === 'sold').length,
        }
        const nextNum = list.reduce((max, p) => Math.max(max, pieceNum(p)), 0) + 1
        return (
          <div key={model.id}>
            <div className="flex items-baseline justify-between mb-5 pb-3 border-b border-[#043672]/10">
              <div className="flex items-baseline gap-4">
                <h2 className="font-display text-[24px] font-light text-[#043672]">{model.name}</h2>
                <span className="text-label text-[8px] text-[#7a7a8a] tracking-[2px]">{list.length} pièces</span>
              </div>
              <div className="hidden sm:flex items-center gap-3 text-label text-[8px] tracking-[1px]">
                <Legend dot="bg-emerald-500" n={c.available} label="dispo" />
                <Legend dot="bg-[#b8965a]" n={c.reserved} label="réservées" />
                <Legend dot="bg-[#043672]" n={c.sold} label="vendues" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {list.map(piece => <PieceCard key={piece.id} piece={piece} />)}
              <AddBagCard model={model.id} modelName={model.name} nextNum={nextNum} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Legend({ dot, n, label }: { dot: string; n: number; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[#7a7a8a]">
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />{n} {label}
    </span>
  )
}

// Carte d'ajout intégrée à la grille — modèle pré-sélectionné, numéro auto
function AddBagCard({ model, modelName, nextNum }: { model: string; modelName: string; nextNum: number }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await addPiece(fd)
        setMsg('Ajouté')
        formRef.current?.reset(); setPreview(null)
        setTimeout(() => { setMsg(null); setOpen(false) }, 1200)
      } catch (err) { setMsg(err instanceof Error ? err.message : 'Erreur') }
    })
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="aspect-square border border-dashed border-[#043672]/25 hover:border-[#b8965a] hover:bg-[#b8965a]/05 transition-colors flex flex-col items-center justify-center gap-2 text-[#7a7a8a] hover:text-[#b8965a]">
        <span className="text-[28px] font-light leading-none">+</span>
        <span className="text-label text-[7px] tracking-[2px]">Ajouter {modelName.replace('Le ', '')}</span>
      </button>
    )
  }

  return (
    <form ref={formRef} onSubmit={submit}
      className="aspect-square border border-[#b8965a]/40 bg-[#faf7f2] p-3 flex flex-col gap-2">
      <input type="hidden" name="model" value={model} />
      <label className="relative flex-1 bg-[#f0ebe0] border border-dashed border-[#043672]/25 cursor-pointer flex items-center justify-center overflow-hidden hover:border-[#b8965a] transition-colors">
        {preview ? <Image src={preview} alt="" fill className="object-cover" />
          : <span className="text-label text-[7px] text-[#7a7a8a] tracking-[1px] text-center px-2">+ Photo</span>}
        <input name="image" type="file" accept="image/*" required hidden
          onChange={e => { const f = e.target.files?.[0]; if (f) setPreview(URL.createObjectURL(f)) }} />
      </label>
      <div className="flex items-center gap-1.5">
        <span className="text-label text-[7px] text-[#7a7a8a] tracking-[1px]">N°</span>
        <input name="displayNum" type="number" min={1} defaultValue={nextNum} required
          className="w-12 text-[11px] border border-[#043672]/20 px-1.5 py-1 bg-white" />
        <button type="submit" disabled={isPending}
          className="flex-1 text-label text-[7px] tracking-[1px] py-1.5 bg-[#043672] text-white hover:bg-[#0a4d9e] disabled:opacity-50">
          {isPending ? '…' : (msg ?? 'Ajouter')}
        </button>
      </div>
      <button type="button" onClick={() => { setOpen(false); setPreview(null) }}
        className="text-label text-[7px] text-[#7a7a8a] hover:text-[#043672] tracking-[1px]">Annuler</button>
    </form>
  )
}

function IconBtn({ onClick, title, children, disabled }: { onClick: () => void; title: string; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      className="w-8 h-8 flex items-center justify-center bg-[#faf7f2]/95 text-[#043672] hover:bg-white hover:text-[#b8965a] shadow-sm transition-colors disabled:opacity-50 text-[13px]">
      {children}
    </button>
  )
}

function PieceCard({ piece }: { piece: InvPiece }) {
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [model, setModel] = useState(piece.model)
  const [num, setNum] = useState(String(pieceNum(piece)))
  const imageInputRef = useRef<HTMLInputElement>(null)
  const info = statusInfo(piece)
  const displayN = pieceNum(piece)

  const act = (fn: () => Promise<void>) => startTransition(async () => {
    try { await fn() } catch (e) { alert(e instanceof Error ? e.message : 'Erreur') }
  })

  const saveReassign = () => act(async () => {
    await reassignPiece(piece.id, model as 'kouna' | 'kami' | 'nafibe', parseInt(num, 10) || 1)
    setEditing(false)
  })

  const onImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData(); fd.append('image', file)
    act(() => changePieceImage(piece.id, fd))
  }

  return (
    <div className="group flex flex-col">
      {/* Image + overlay actions */}
      <div className="relative aspect-square overflow-hidden bg-[#f0ebe0]">
        <Image src={piece.image_url} alt={piece.id} fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          style={{ filter: piece.status === 'sold' ? 'grayscale(0.5)' : 'none' }} sizes="200px" />

        {/* Numéro */}
        <div className="absolute top-0 left-0 bg-[#043672] text-white px-2.5 py-1">
          <span className="font-display text-[13px] font-light leading-none">{String(displayN).padStart(2, '0')}</span>
        </div>

        {/* Actions au hover */}
        <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <IconBtn onClick={() => imageInputRef.current?.click()} title="Changer la photo" disabled={isPending}>⟳</IconBtn>
          <IconBtn onClick={() => setEditing(e => !e)} title="Modifier modèle / numéro">✎</IconBtn>
        </div>
        <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={onImagePick} />

        {/* Voile pendant chargement */}
        {isPending && <div className="absolute inset-0 bg-[#faf7f2]/50 flex items-center justify-center">
          <span className="w-5 h-5 border-2 border-[#b8965a] border-t-transparent rounded-full animate-spin" /></div>}
      </div>

      {/* Statut */}
      <div className={`flex items-center gap-1.5 px-2.5 py-1.5 ${info.cls}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${info.dot}`} />
        <span className="text-label text-[7px] tracking-[1px]">{info.label}</span>
      </div>

      {/* Panneau édition */}
      {editing && (
        <div className="flex flex-col gap-2 p-3 bg-[#faf7f2] border-x border-b border-[#b8965a]/30">
          <select value={model} onChange={e => setModel(e.target.value)}
            className="text-[11px] border border-[#043672]/20 px-2 py-1.5 bg-white">
            {MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <div className="flex gap-1.5 items-center">
            <span className="text-label text-[7px] text-[#7a7a8a] tracking-[1px]">N°</span>
            <input type="number" min={1} value={num} onChange={e => setNum(e.target.value)}
              className="w-14 text-[11px] border border-[#043672]/20 px-2 py-1.5 bg-white" />
            <button onClick={saveReassign} disabled={isPending}
              className="flex-1 text-label text-[7px] tracking-[1px] py-1.5 bg-[#043672] text-white hover:bg-[#0a4d9e] disabled:opacity-50">
              Enregistrer
            </button>
          </div>
          {piece.status === 'available' && (
            <button onClick={() => { if (confirm('Supprimer cette pièce ?')) act(() => deletePiece(piece.id)) }} disabled={isPending}
              className="text-label text-[7px] tracking-[1px] py-1.5 border border-red-200 text-red-500 hover:bg-red-50">
              Supprimer
            </button>
          )}
        </div>
      )}

      {/* Actions statut rapides */}
      {!editing && (piece.status !== 'available' || piece.status === 'available') && (
        <div className="flex gap-px mt-1.5">
          {piece.status !== 'available' && (
            <button onClick={() => act(() => releasePiece(piece.id))} disabled={isPending}
              className="flex-1 text-label text-[7px] tracking-[1px] py-2 border border-emerald-200 text-emerald-700 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-colors disabled:opacity-50">
              Libérer
            </button>
          )}
          {piece.status !== 'sold' && (
            <button onClick={() => act(() => setPieceStatus(piece.id, 'sold'))} disabled={isPending}
              className="flex-1 text-label text-[7px] tracking-[1px] py-2 border border-[#043672]/20 text-[#043672] hover:bg-[#043672] hover:text-white transition-colors disabled:opacity-50">
              Marquer vendue
            </button>
          )}
        </div>
      )}

      {piece.order_ref && <span className="text-[8px] text-[#7a7a8a] font-mono text-center mt-1">{piece.order_ref}</span>}
    </div>
  )
}
