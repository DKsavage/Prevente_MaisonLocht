'use client'

import { useState, useTransition, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateOrderStatus, updateTracking, updateNotes, sendStatusEmail, resendConfirmation, sendCorrectionEmail, getOrderPieces, type OrderStatus } from '@/app/admin/actions'
import { timeAgo } from '@/lib/time'
import { CARRIERS, trackingUrl } from '@/lib/carriers'

export type Order = {
  reference: string
  status: OrderStatus
  bag_name: string
  quantity: number
  price_total: number
  first_name: string
  last_name: string
  email: string
  phone: string | null
  address: string
  city: string
  province: string | null
  postal_code: string
  country: string | null
  lang: string
  why_locht: string | null
  notes_admin: string | null
  tracking_number: string | null
  carrier: string | null
  interac_answer: string | null
  created_at: string
}

function isLate(o: Order) {
  if (o.status !== 'pending') return false
  return Date.now() - new Date(o.created_at).getTime() > 3 * 24 * 60 * 60 * 1000
}

const STATUS_FR_CSV: Record<string, string> = {
  pending: 'En attente', payment_received: 'Paiement reçu',
  confirmed: 'Confirmée', shipped: 'Expédiée', cancelled: 'Annulée',
}

function exportCsv(orders: Order[]) {
  const headers = ['Référence', 'Statut', 'Prénom', 'Nom', 'Email', 'Téléphone', 'Pièces', 'Quantité', 'Total', 'Adresse', 'Ville', 'Province', 'Code postal', 'Pays', 'Suivi', 'Date']
  const fmtDate = (d: string) => {
    const dt = new Date(d)
    return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`
  }
  const rows = orders.map(o => [
    o.reference, STATUS_FR_CSV[o.status] ?? o.status, o.first_name, o.last_name, o.email, o.phone ?? '', o.bag_name,
    o.quantity, o.price_total, o.address, o.city, o.province ?? '', o.postal_code, o.country ?? '',
    o.tracking_number ?? '', fmtDate(o.created_at),
  ])
  const esc = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`
  const csv = '﻿' + [headers, ...rows].map(r => r.map(esc).join(';')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `maison-locht-commandes-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending:          'En attente',
  payment_received: 'Paiement reçu',
  confirmed:        'Confirmée',
  shipped:          'Expédiée',
  cancelled:        'Annulée',
}

const STATUS_SHORT: Record<OrderStatus, string> = {
  pending:          'Attente',
  payment_received: 'Payée',
  confirmed:        'Confirmée',
  shipped:          'Expédiée',
  cancelled:        'Annulée',
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending:          'bg-[#b8965a]/15 text-[#9a7a3a] border-[#b8965a]/30',
  payment_received: 'bg-blue-50 text-blue-700 border-blue-200',
  confirmed:        'bg-emerald-50 text-emerald-700 border-emerald-200',
  shipped:          'bg-[#043672]/10 text-[#043672] border-[#043672]/20',
  cancelled:        'bg-red-50 text-red-600 border-red-200',
}

// Left border accent color per status — enables instant visual scanning
const STATUS_LEFT_COLOR: Record<OrderStatus, string> = {
  pending:          '#b8965a',
  payment_received: '#3b82f6',
  confirmed:        '#10b981',
  shipped:          '#043672',
  cancelled:        '#ef4444',
}

// Progression linéaire des statuts (hors annulé)
const STATUS_FLOW: OrderStatus[] = ['pending', 'payment_received', 'confirmed', 'shipped']

const ALL_STATUS: OrderStatus[] = ['pending', 'payment_received', 'confirmed', 'shipped', 'cancelled']

export default function OrdersTable({ initialOrders }: { initialOrders: Order[] }) {
  const router = useRouter()
  const orders = initialOrders
  const [filter, setFilter] = useState<'all' | OrderStatus | 'late'>('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [autoRefresh] = useState(true)

  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(() => router.refresh(), 25000)
    return () => clearInterval(id)
  }, [autoRefresh, router])

  const lateCount = orders.filter(isLate).length

  const filtered = useMemo(() => {
    let list = filter === 'all' ? orders
      : filter === 'late' ? orders.filter(isLate)
      : orders.filter(o => o.status === filter)
    const q = query.trim().toLowerCase()
    if (q) list = list.filter(o =>
      o.reference.toLowerCase().includes(q) ||
      `${o.first_name} ${o.last_name}`.toLowerCase().includes(q) ||
      o.email.toLowerCase().includes(q))
    const sorted = [...list]
    sorted.sort((a, b) => {
      switch (sort) {
        case 'date_asc':    return +new Date(a.created_at) - +new Date(b.created_at)
        case 'amount_desc': return Number(b.price_total) - Number(a.price_total)
        case 'amount_asc':  return Number(a.price_total) - Number(b.price_total)
        default:            return +new Date(b.created_at) - +new Date(a.created_at)
      }
    })
    return sorted
  }, [orders, filter, query, sort])

  return (
    <div className="flex flex-col gap-4">
      {/* Recherche + export */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <input
          value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Rechercher (référence, nom, email)…"
          className="flex-1 max-w-md bg-[#faf7f2] border border-[#043672]/15 focus:border-[#b8965a] outline-none px-4 py-2.5 text-[12px] transition-colors"
        />
        <div className="flex items-center gap-2">
          <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}
            className="text-label text-[10px] tracking-[1px] px-3 py-2.5 border border-[#043672]/20 bg-[#faf7f2] text-[#043672] outline-none focus:border-[#b8965a]">
            <option value="date_desc">Plus récentes</option>
            <option value="date_asc">Plus anciennes</option>
            <option value="amount_desc">Montant ↓</option>
            <option value="amount_asc">Montant ↑</option>
          </select>
          <button onClick={() => router.refresh()}
            className="text-label text-[10px] tracking-[2px] px-4 py-2.5 border border-[#043672]/20 text-[#043672] hover:bg-[#043672] hover:text-white transition-colors whitespace-nowrap">
            ↻ Actualiser
          </button>
          <button onClick={() => exportCsv(filtered)}
            className="text-label text-[10px] tracking-[2px] px-4 py-2.5 border border-[#043672]/20 text-[#043672] hover:bg-[#043672] hover:text-white transition-colors whitespace-nowrap">
            ↓ CSV ({filtered.length})
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} label={`Toutes (${orders.length})`} />
        {lateCount > 0 && (
          <button onClick={() => setFilter('late')}
            className={`text-label text-[10px] tracking-[2px] px-3 py-2 border transition-colors ${
              filter === 'late' ? 'bg-red-500 text-white border-red-500' : 'bg-red-50 text-red-600 border-red-200 hover:border-red-400'
            }`}>
            ⚠ Paiement en retard ({lateCount})
          </button>
        )}
        {ALL_STATUS.map(s => {
          const n = orders.filter(o => o.status === s).length
          if (n === 0) return null
          return <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)} label={`${STATUS_LABELS[s]} (${n})`} />
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-[13px] text-[#7a7a8a] font-light border border-dashed border-[#043672]/15">
          Aucune commande.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(order => (
            <OrderRow key={order.reference} order={order}
              expanded={expanded === order.reference}
              onToggle={() => setExpanded(expanded === order.reference ? null : order.reference)} />
          ))}
        </div>
      )}
    </div>
  )
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick}
      className={`text-label text-[10px] tracking-[2px] px-3 py-2 border transition-colors ${
        active ? 'bg-[#043672] text-white border-[#043672]' : 'bg-[#faf7f2] text-[#7a7a8a] border-[#043672]/15 hover:border-[#043672]/40'
      }`}>
      {label}
    </button>
  )
}

type PieceItem = { id: string; model: string; image_url: string; display_num: number }
const MODEL_NAMES: Record<string, string> = { kouna: 'Le Kouna', kami: 'Le Kami', nafibe: 'Le Nafibe' }

function OrderRow({ order, expanded, onToggle }: { order: Order; expanded: boolean; onToggle: () => void }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [tracking, setTracking] = useState(order.tracking_number ?? '')
  const [carrier, setCarrier] = useState(order.carrier ?? '')
  const [notes, setNotes] = useState(order.notes_admin ?? '')
  const [msg, setMsg] = useState<string | null>(null)
  const [pieces, setPieces] = useState<PieceItem[]>([])
  const [piecesLoaded, setPiecesLoaded] = useState(false)
  const late = isLate(order)

  useEffect(() => {
    if (expanded && !piecesLoaded) {
      getOrderPieces(order.reference).then(p => {
        setPieces(p as PieceItem[])
        setPiecesLoaded(true)
      })
    }
  }, [expanded, piecesLoaded, order.reference])

  const fullAddress = `${order.first_name} ${order.last_name}\n${order.address}\n${order.city}${order.province ? ', ' + order.province : ''} ${order.postal_code}\n${order.country ?? ''}`

  const copyAddress = () => {
    navigator.clipboard.writeText(fullAddress)
    setMsg('Adresse copiée')
    setTimeout(() => setMsg(null), 2000)
  }

  const saveNotes = () => {
    startTransition(async () => {
      await updateNotes(order.reference, notes)
      router.refresh()
      setMsg('Note enregistrée')
      setTimeout(() => setMsg(null), 2000)
    })
  }

  const changeStatus = (status: OrderStatus) => {
    const confirmMessages: Partial<Record<OrderStatus, string>> = {
      payment_received: `Confirmer la réception du paiement de ${order.first_name} ${order.last_name} ?\n\nUn email "Paiement reçu" sera envoyé automatiquement.`,
      shipped: `Marquer la commande de ${order.first_name} ${order.last_name} comme expédiée ?\n\nUn email "Commande expédiée" sera envoyé automatiquement.`,
      cancelled: `Annuler la commande ${order.reference} de ${order.first_name} ${order.last_name} ?\n\nCette action libérera les pièces réservées.`,
    }
    const confirmMsg = confirmMessages[status]
    if (confirmMsg && !window.confirm(confirmMsg)) return
    startTransition(async () => {
      await updateOrderStatus(order.reference, status)
      router.refresh()
      setMsg(status === 'payment_received' || status === 'shipped' ? 'Statut mis à jour · email envoyé' : 'Statut mis à jour')
      setTimeout(() => setMsg(null), 3000)
    })
  }

  const saveTracking = () => {
    startTransition(async () => {
      await updateTracking(order.reference, tracking, carrier)
      router.refresh()
      setMsg('Suivi enregistré')
      setTimeout(() => setMsg(null), 2000)
    })
  }

  const email = (kind: 'payment' | 'shipped') => {
    const label = kind === 'payment' ? 'Paiement reçu' : 'Commande expédiée'
    if (!window.confirm(`Renvoyer manuellement l'email "${label}" à ${order.first_name} ${order.last_name} (${order.email}) ?`)) return
    startTransition(async () => {
      try { await sendStatusEmail(order.reference, kind); setMsg(`Email "${label}" envoyé`) }
      catch { setMsg('Échec email') }
      setTimeout(() => setMsg(null), 2500)
    })
  }

  const resend = () => {
    if (!window.confirm(`Renvoyer l'email de confirmation original à ${order.first_name} ${order.last_name} (${order.email}) ?`)) return
    startTransition(async () => {
      try { await resendConfirmation(order.reference); setMsg('Confirmation renvoyée') }
      catch { setMsg('Échec email') }
      setTimeout(() => setMsg(null), 2500)
    })
  }

  const correction = () => {
    if (!window.confirm(`Envoyer un email de CORRECTION à ${order.first_name} ${order.last_name} (${order.email}) ?\n\nCet email expliquera l'erreur et rappellera les instructions de paiement.`)) return
    startTransition(async () => {
      try { await sendCorrectionEmail(order.reference); setMsg('Email de correction envoyé') }
      catch { setMsg('Échec envoi') }
      setTimeout(() => setMsg(null), 2500)
    })
  }

  const dateExact = new Date(order.created_at).toLocaleDateString('fr-CA', { day: '2-digit', month: 'short', year: 'numeric' })
  const date = timeAgo(order.created_at)

  // Extraire le nom court du modèle pour le chip (ex: "Le Kouna, Le Kami" → "Kouna · Kami")
  const bagChip = order.bag_name.replace(/Le /g, '').replace(/, /g, ' · ')

  return (
    <div
      className={`border-l-[3px] border-r border-t border-b transition-colors ${
        late ? 'bg-amber-50/30' : 'bg-[#faf7f2]'
      } ${expanded ? 'border-r-[#b8965a]/30 border-t-[#b8965a]/30 border-b-[#b8965a]/30' : 'border-r-[#043672]/10 border-t-[#043672]/10 border-b-[#043672]/10'}`}
      style={{ borderLeftColor: STATUS_LEFT_COLOR[order.status] }}
    >
      {/* ── Ligne principale ── */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={onToggle} className="flex items-center gap-3 flex-1 min-w-0 text-left">
          {late && (
            <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 animate-pulse" title="Paiement en retard" />
          )}
          <span className="font-mono text-[10px] text-[#043672]/55 w-[112px] flex-shrink-0 hidden sm:block tracking-[0.5px]">
            {order.reference}
          </span>
          <span className="text-[13px] font-light text-[#1a1a2e] flex-1 min-w-0 truncate flex items-center gap-2">
            {order.first_name} {order.last_name}
            {order.notes_admin && (
              <span className="text-[#b8965a] text-[11px]" title="Note interne">✎</span>
            )}
          </span>
          {/* Chip modèle — visible sans ouvrir la ligne */}
          <span className="hidden md:inline-block text-[9px] tracking-[1px] uppercase px-2 py-0.5 bg-[#b8965a]/08 text-[#9a7a3a] border border-[#b8965a]/20 flex-shrink-0 whitespace-nowrap">
            {bagChip}
          </span>
          <span className="hidden md:block text-[11px] text-[#7a7a8a] w-[36px] text-center flex-shrink-0">
            {order.country ?? '—'}
          </span>
          <span className="hidden sm:block text-[13px] text-[#043672] font-medium w-[86px] text-right flex-shrink-0">
            {order.price_total} CAD
          </span>
        </button>

        {/* Bouton rapide paiement — pending uniquement */}
        {order.status === 'pending' && (
          <button
            onClick={() => changeStatus('payment_received')}
            disabled={isPending}
            title="Confirmer la réception du paiement"
            className="flex-shrink-0 flex items-center gap-1.5 text-[9px] tracking-[1px] uppercase font-medium px-3 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-colors disabled:opacity-50"
          >
            <span className="text-[12px] leading-none">✓</span>
            <span className="hidden sm:block">Paiement reçu</span>
          </button>
        )}

        <button onClick={onToggle} className="flex items-center gap-3 flex-shrink-0">
          <span className={`text-label text-[9px] tracking-[1px] px-2.5 py-1 border ${STATUS_COLORS[order.status]} min-w-[106px] text-center`}>
            {STATUS_LABELS[order.status]}
          </span>
          <span className="hidden lg:block text-[10px] text-[#7a7a8a] w-[72px] text-right" title={dateExact}>
            {date}
          </span>
        </button>
      </div>

      {/* ── Détails expandés ── */}
      {expanded && (
        <div className="border-t border-[#043672]/06 px-4 pb-5 pt-4">
          <div className="grid md:grid-cols-[1fr_288px] lg:grid-cols-[1fr_320px] gap-6 lg:gap-8">

            {/* ── Colonne gauche : infos commande + client ── */}
            <div className="flex flex-col gap-5">

              {/* Photos des pièces */}
              {pieces.length > 0 && (
                <div className="flex flex-col gap-2.5">
                  <SectionLabel>Pièces commandées</SectionLabel>
                  <div className="flex gap-4 flex-wrap">
                    {pieces.map(p => (
                      <div key={p.id} className="flex flex-col gap-1.5">
                        <img
                          src={p.image_url}
                          alt={MODEL_NAMES[p.model] ?? p.model}
                          className="w-24 h-24 object-cover border border-[#043672]/10 hover:border-[#b8965a]/50 transition-colors"
                        />
                        <div>
                          <p className="text-[10px] font-light text-[#043672] italic leading-tight">
                            {MODEL_NAMES[p.model] ?? p.model}
                          </p>
                          <p className="text-label text-[8px] text-[#b8965a] tracking-[1px] mt-0.5">
                            Pièce N°{String(p.display_num).padStart(2, '0')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Info commande + client */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <SectionLabel>Commande</SectionLabel>
                  <Detail label="Référence" value={order.reference} mono />
                  <Detail label="Pièces" value={order.bag_name} />
                  <Detail label="Quantité" value={String(order.quantity)} />
                  <Detail label="Total" value={`${order.price_total} CAD`} />
                  {order.interac_answer && (
                    <div className="flex gap-2 items-center mt-1.5">
                      <span className="text-[#7a7a8a] text-[11px] w-[72px] flex-shrink-0">Rép. Interac</span>
                      <span className="font-mono text-[11px] text-[#043672] bg-[#b8965a]/10 border border-[#b8965a]/25 px-2 py-0.5 tracking-[1px]">
                        {order.interac_answer}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <SectionLabel>Client</SectionLabel>
                  <Detail label="Email" value={order.email} />
                  <Detail label="Tél." value={order.phone ?? '—'} />
                  <div className="flex gap-2 items-start mt-0.5">
                    <span className="text-[#7a7a8a] text-[11px] w-[72px] flex-shrink-0 mt-0.5">Adresse</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-[#1a1a2e] font-light leading-relaxed">
                        {order.address}<br />
                        {order.city}{order.province ? `, ${order.province}` : ''} {order.postal_code}<br />
                        {order.country ?? ''}
                      </p>
                      <button
                        onClick={copyAddress}
                        className="mt-1.5 text-label text-[9px] text-[#b8965a] hover:text-[#043672] tracking-[1px] border border-[#b8965a]/25 px-2 py-0.5 transition-colors"
                      >
                        Copier
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Why locht + note colis */}
              {order.why_locht && (
                <div className="flex flex-col gap-3">
                  <div className="border-l-2 border-[#b8965a] bg-[#f0ebe0] px-4 py-3">
                    <SectionLabel>Ce qui l&apos;a attiré</SectionLabel>
                    <p className="text-[12px] text-[#1a1a2e] font-light italic leading-relaxed mt-1">
                      &laquo; {order.why_locht} &raquo;
                    </p>
                  </div>
                  <NoteColis
                    firstName={order.first_name}
                    bagName={order.bag_name}
                    reference={order.reference}
                    why={order.why_locht}
                  />
                </div>
              )}

              {/* Notes admin */}
              <div className="flex flex-col gap-1.5">
                <SectionLabel>Note interne (privée)</SectionLabel>
                {order.notes_admin && (
                  <div className="bg-[#043672]/04 border-l-2 border-[#b8965a]/50 px-3 py-2 mb-1">
                    <p className="text-[11px] text-[#043672] font-light italic">{order.notes_admin}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder={order.notes_admin ? 'Modifier la note…' : 'Ex : cliente fidèle, adresse à vérifier…'}
                    className="flex-1 bg-white border border-[#043672]/12 focus:border-[#b8965a] outline-none px-3 py-2 text-[12px] min-w-0"
                  />
                  <button
                    onClick={saveNotes} disabled={isPending}
                    className="text-label text-[9px] tracking-[1px] px-4 py-2 bg-[#043672] text-white disabled:opacity-50 flex-shrink-0 hover:bg-[#0a4d9e] transition-colors"
                  >
                    {isPending ? '…' : 'Sauver'}
                  </button>
                </div>
              </div>
            </div>

            {/* ── Colonne droite : actions ── */}
            <div className="flex flex-col gap-5 md:border-l md:border-[#043672]/08 md:pl-6">

              {/* Status stepper — action principale */}
              <StatusStepper
                currentStatus={order.status}
                onAdvance={changeStatus}
                isPending={isPending}
              />

              {/* Annuler (danger, discret) */}
              {order.status !== 'cancelled' && order.status !== 'shipped' && (
                <button
                  onClick={() => changeStatus('cancelled')} disabled={isPending}
                  className="text-label text-[9px] tracking-[1px] px-3 py-1.5 border border-red-200 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors disabled:opacity-50 self-start"
                >
                  Annuler la commande
                </button>
              )}

              {/* Expédition & suivi */}
              <div className="flex flex-col gap-2">
                <SectionLabel>Expédition & suivi</SectionLabel>
                <div className="flex gap-2">
                  <select
                    value={carrier} onChange={e => setCarrier(e.target.value)}
                    className="bg-white border border-[#043672]/12 focus:border-[#b8965a] outline-none px-2 py-2 text-[11px] flex-shrink-0"
                  >
                    <option value="">Transporteur</option>
                    {CARRIERS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <input
                    value={tracking} onChange={e => setTracking(e.target.value)}
                    placeholder="N° de suivi"
                    className="flex-1 bg-white border border-[#043672]/12 focus:border-[#b8965a] outline-none px-3 py-2 text-[12px] min-w-0"
                  />
                  <button
                    onClick={saveTracking} disabled={isPending}
                    className="text-label text-[9px] tracking-[1px] px-3 py-2 bg-[#043672] text-white disabled:opacity-50 flex-shrink-0 hover:bg-[#0a4d9e] transition-colors"
                  >
                    OK
                  </button>
                </div>
                {tracking && trackingUrl(carrier, tracking) && (
                  <a
                    href={trackingUrl(carrier, tracking)!}
                    target="_blank" rel="noopener noreferrer"
                    className="text-label text-[9px] text-[#b8965a] hover:text-[#043672] tracking-[1px] underline underline-offset-2 transition-colors self-start"
                  >
                    Vérifier le suivi →
                  </a>
                )}
              </div>

              {/* Communications client */}
              <div className="flex flex-col gap-2">
                <SectionLabel>Communications client</SectionLabel>
                <div className="flex flex-col gap-1">
                  <EmailBtn onClick={resend} disabled={isPending} title="Renvoie l'email de confirmation original avec instructions de paiement">
                    ↩ Renvoyer confirmation
                  </EmailBtn>
                  <EmailBtn onClick={() => email('payment')} disabled={isPending} title="Renvoie l'email Paiement reçu">
                    ↩ Renvoyer : Paiement reçu
                  </EmailBtn>
                  <EmailBtn onClick={() => email('shipped')} disabled={isPending} title="Renvoie l'email Commande expédiée">
                    ↩ Renvoyer : Commande expédiée
                  </EmailBtn>
                  <div className="h-px bg-[#043672]/08 my-1" />
                  <button
                    onClick={correction} disabled={isPending}
                    title="Email d'excuse pour un envoi erroné — rappelle les instructions de paiement"
                    className="text-left text-label text-[9px] tracking-[1px] px-3 py-2 border border-[#b8965a]/35 text-[#b8965a] hover:bg-[#b8965a] hover:text-white transition-colors disabled:opacity-50"
                  >
                    ⚠ Email correction (envoi erroné)
                  </button>
                </div>
              </div>

              {/* Feedback */}
              {msg && (
                <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 border-l-2 border-l-emerald-400">
                  <p className="text-[11px] text-emerald-700 font-light">{msg}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Composants utilitaires ──

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-label text-[10px] text-[#b8965a] tracking-[2px] uppercase block mb-0.5">
      {children}
    </span>
  )
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-2 items-baseline">
      <span className="text-[#7a7a8a] text-[11px] w-[72px] flex-shrink-0">{label}</span>
      <span className={`text-[#1a1a2e] text-[11px] font-light ${mono ? 'font-mono tracking-[0.5px]' : ''}`}>
        {value}
      </span>
    </div>
  )
}

function EmailBtn({ onClick, disabled, title, children }: {
  onClick: () => void
  disabled: boolean
  title?: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick} disabled={disabled} title={title}
      className="text-left text-label text-[9px] tracking-[1px] px-3 py-2 border border-[#043672]/12 text-[#043672] hover:bg-[#043672] hover:text-white transition-colors disabled:opacity-50"
    >
      {children}
    </button>
  )
}

function StatusStepper({ currentStatus, onAdvance, isPending }: {
  currentStatus: OrderStatus
  onAdvance: (s: OrderStatus) => void
  isPending: boolean
}) {
  const currentIdx = STATUS_FLOW.indexOf(currentStatus)
  const isCancelled = currentStatus === 'cancelled'

  if (isCancelled) {
    return (
      <div className="flex flex-col gap-2">
        <SectionLabel>Progression commande</SectionLabel>
        <div className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 self-start">
          <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
          <span className="text-[10px] text-red-600 tracking-[1px] uppercase font-medium">Annulée</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <SectionLabel>Progression commande</SectionLabel>
      <div className="flex items-start">
        {STATUS_FLOW.map((s, i) => {
          const isPast    = i < currentIdx
          const isCurrent = i === currentIdx
          const isNext    = i === currentIdx + 1

          return (
            <div key={s} className="flex items-center flex-shrink-0">
              {i > 0 && (
                <div className={`h-px w-5 mt-[-20px] flex-shrink-0 ${isPast ? 'bg-emerald-400' : 'bg-[#043672]/15'}`} />
              )}
              <button
                disabled={isPending || !isNext}
                onClick={() => onAdvance(s)}
                title={isNext ? `Avancer → ${STATUS_LABELS[s]}` : STATUS_LABELS[s]}
                className={`flex flex-col items-center gap-1.5 px-1.5 transition-opacity ${
                  isNext ? 'cursor-pointer' : 'cursor-default'
                } ${!isPast && !isCurrent && !isNext ? 'opacity-25' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[11px] font-medium transition-all ${
                  isPast    ? 'bg-emerald-50 border-emerald-400 text-emerald-600' :
                  isCurrent ? 'bg-[#043672] border-[#043672] text-white' :
                  isNext    ? 'bg-white border-[#043672]/35 text-[#7a7a8a] hover:border-[#043672] hover:bg-[#043672]/05 hover:text-[#043672]' :
                              'bg-white border-[#043672]/12 text-[#043672]/20'
                }`}>
                  {isPast ? '✓' : i + 1}
                </div>
                <span className={`text-[8px] tracking-[0.5px] uppercase font-medium text-center leading-tight max-w-[52px] ${
                  isCurrent ? 'text-[#043672]' :
                  isPast    ? 'text-emerald-600' :
                  isNext    ? 'text-[#7a7a8a]' :
                              'text-[#043672]/25'
                }`}>
                  {STATUS_SHORT[s]}
                </span>
              </button>
            </div>
          )
        })}
      </div>
      {currentIdx < STATUS_FLOW.length - 1 && (
        <p className="text-[10px] text-[#7a7a8a] font-light leading-relaxed">
          Cliquer sur l&apos;étape suivante pour avancer.
        </p>
      )}
    </div>
  )
}

function NoteColis({ firstName, bagName, reference, why }: {
  firstName: string; bagName: string; reference: string; why: string
}) {
  const [copied, setCopied] = useState(false)

  const note = `Chère ${firstName},\n\nTon ${bagName} — réf. ${reference} — t'attend.\n\nTu nous avais dit :\n« ${why} »\n\nCette pièce porte exactement ça.\n\n— Maison Locht`

  const copy = () => {
    navigator.clipboard.writeText(note)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-[#021f45] px-4 py-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-label text-[9px] text-[#d4aa6a] tracking-[3px]">Note à glisser dans le colis</span>
        <button
          onClick={copy}
          className="text-label text-[9px] tracking-[1px] px-3 py-1.5 border border-[#d4aa6a]/40 text-[#d4aa6a] hover:bg-[#d4aa6a] hover:text-[#021f45] transition-colors"
        >
          {copied ? '✓ Copié' : 'Copier'}
        </button>
      </div>
      <pre className="text-[11px] text-white/70 font-light leading-relaxed whitespace-pre-wrap font-sans">{note}</pre>
    </div>
  )
}
