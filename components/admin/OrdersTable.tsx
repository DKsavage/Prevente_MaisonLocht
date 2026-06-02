'use client'

import { useState, useTransition, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateOrderStatus, updateTracking, updateNotes, sendStatusEmail, resendConfirmation, type OrderStatus } from '@/app/admin/actions'
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

// Une commande pending depuis +3 jours = paiement en retard
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
  pending: 'En attente',
  payment_received: 'Paiement reçu',
  confirmed: 'Confirmée',
  shipped: 'Expédiée',
  cancelled: 'Annulée',
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-[#b8965a]/15 text-[#9a7a3a] border-[#b8965a]/30',
  payment_received: 'bg-blue-50 text-blue-700 border-blue-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  shipped: 'bg-[#043672]/10 text-[#043672] border-[#043672]/20',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
}

const ALL_STATUS: OrderStatus[] = ['pending', 'payment_received', 'confirmed', 'shipped', 'cancelled']

export default function OrdersTable({ initialOrders }: { initialOrders: Order[] }) {
  const router = useRouter()
  const orders = initialOrders
  const [filter, setFilter] = useState<'all' | OrderStatus | 'late'>('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [autoRefresh] = useState(true)

  // Rafraîchissement automatique toutes les 25s (nouvelles commandes)
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
    // Tri
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
            className="text-label text-[8px] tracking-[1px] px-3 py-2.5 border border-[#043672]/20 bg-[#faf7f2] text-[#043672] outline-none focus:border-[#b8965a]">
            <option value="date_desc">Plus récentes</option>
            <option value="date_asc">Plus anciennes</option>
            <option value="amount_desc">Montant ↓</option>
            <option value="amount_asc">Montant ↑</option>
          </select>
          <button onClick={() => router.refresh()}
            className="text-label text-[8px] tracking-[2px] px-4 py-2.5 border border-[#043672]/20 text-[#043672] hover:bg-[#043672] hover:text-white transition-colors whitespace-nowrap">
            ↻ Rafraîchir
          </button>
          <button onClick={() => exportCsv(filtered)}
            className="text-label text-[8px] tracking-[2px] px-4 py-2.5 border border-[#043672]/20 text-[#043672] hover:bg-[#043672] hover:text-white transition-colors whitespace-nowrap">
            ↓ CSV ({filtered.length})
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} label={`Toutes (${orders.length})`} />
        {lateCount > 0 && (
          <button onClick={() => setFilter('late')}
            className={`text-label text-[8px] tracking-[2px] px-3 py-2 border transition-colors ${
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
      className={`text-label text-[8px] tracking-[2px] px-3 py-2 border transition-colors ${
        active ? 'bg-[#043672] text-white border-[#043672]' : 'bg-[#faf7f2] text-[#7a7a8a] border-[#043672]/15 hover:border-[#043672]/40'
      }`}>
      {label}
    </button>
  )
}

function OrderRow({ order, expanded, onToggle }: { order: Order; expanded: boolean; onToggle: () => void }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [tracking, setTracking] = useState(order.tracking_number ?? '')
  const [carrier, setCarrier] = useState(order.carrier ?? '')
  const [notes, setNotes] = useState(order.notes_admin ?? '')
  const [msg, setMsg] = useState<string | null>(null)
  const late = isLate(order)

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
    startTransition(async () => {
      await updateOrderStatus(order.reference, status)
      router.refresh()
      setMsg('Statut mis à jour')
      setTimeout(() => setMsg(null), 2000)
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
    startTransition(async () => {
      try { await sendStatusEmail(order.reference, kind); setMsg('Email envoyé') }
      catch { setMsg('Échec email') }
      setTimeout(() => setMsg(null), 2500)
    })
  }

  const resend = () => {
    startTransition(async () => {
      try { await resendConfirmation(order.reference); setMsg('Confirmation renvoyée') }
      catch { setMsg('Échec email') }
      setTimeout(() => setMsg(null), 2500)
    })
  }

  const dateExact = new Date(order.created_at).toLocaleDateString('fr-CA', { day: '2-digit', month: 'short', year: 'numeric' })
  const date = timeAgo(order.created_at)

  return (
    <div className={`border bg-[#faf7f2] transition-colors ${expanded ? 'border-[#b8965a]/40' : 'border-[#043672]/10'}`}>
      {/* Ligne principale */}
      <div className="w-full flex items-center gap-4 px-4 py-3">
        <button onClick={onToggle} className="flex items-center gap-4 flex-1 min-w-0 text-left">
          {late && <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" title="Paiement en retard" />}
          <span className="font-mono text-[11px] text-[#043672] w-[120px] flex-shrink-0">{order.reference}</span>
          <span className="text-[13px] text-[#1a1a2e] flex-1 min-w-0 truncate flex items-center gap-2">
            {order.first_name} {order.last_name}
            {order.notes_admin && <span className="text-[#b8965a] text-[10px]" title="Note interne">✎</span>}
          </span>
          <span className="hidden md:block text-[11px] text-[#7a7a8a] w-[60px]">{order.country ?? '—'}</span>
          <span className="hidden sm:block text-[12px] text-[#043672] w-[90px] text-right">{order.price_total} CAD</span>
        </button>
        {/* Marquer payé rapide (commandes en attente) */}
        {order.status === 'pending' && (
          <button onClick={() => changeStatus('payment_received')} disabled={isPending}
            className="text-label text-[7px] tracking-[1px] px-2.5 py-1.5 border border-emerald-300 text-emerald-700 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-colors disabled:opacity-50 flex-shrink-0"
            title="Marquer comme payé">
            ✓ Payé
          </button>
        )}
        <button onClick={onToggle} className="flex items-center gap-4 flex-shrink-0">
          <span className={`text-label text-[7px] tracking-[1px] px-2 py-1 border ${STATUS_COLORS[order.status]} w-[110px] text-center`}>
            {STATUS_LABELS[order.status]}
          </span>
          <span className="hidden md:block text-[10px] text-[#7a7a8a] w-[80px] text-right" title={dateExact}>{date}</span>
        </button>
      </div>

      {/* Détails */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-[#043672]/06 flex flex-col gap-4">
          <div className="grid md:grid-cols-2 gap-4 text-[12px]">
            <div className="flex flex-col gap-1">
              <Detail label="Pièces" value={order.bag_name} />
              <Detail label="Quantité" value={String(order.quantity)} />
              <Detail label="Total" value={`${order.price_total} CAD`} />
              {order.interac_answer && (
                <div className="flex gap-2 items-center mt-1">
                  <span className="text-[#7a7a8a] w-[70px] flex-shrink-0">Rép. Interac</span>
                  <span className="text-[12px] font-mono text-[#043672] bg-[#b8965a]/12 border border-[#b8965a]/30 px-2 py-0.5">{order.interac_answer}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <Detail label="Courriel" value={order.email} />
              <Detail label="Téléphone" value={order.phone ?? '—'} />
              <div className="flex gap-2 items-start">
                <span className="text-[#7a7a8a] w-[70px] flex-shrink-0">Adresse</span>
                <div className="flex-1">
                  <span className="text-[#1a1a2e]">{order.address}, {order.city}{order.province ? ', ' + order.province : ''} {order.postal_code}, {order.country ?? ''}</span>
                  <button onClick={copyAddress}
                    className="ml-2 text-label text-[7px] text-[#b8965a] hover:text-[#043672] tracking-[1px] border border-[#b8965a]/30 px-2 py-0.5 transition-colors">
                    Copier
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Notes internes */}
          <div className="flex flex-col gap-1.5">
            <span className="text-label text-[7px] text-[#b8965a] tracking-[2px]">Note interne (privée)</span>
            {/* Note enregistrée — visible */}
            {order.notes_admin && (
              <div className="bg-[#043672]/05 border-l-2 border-[#b8965a] px-3 py-2">
                <span className="text-[12px] text-[#043672] font-light italic">{order.notes_admin}</span>
              </div>
            )}
            <div className="flex gap-2">
              <input value={notes} onChange={e => setNotes(e.target.value)}
                placeholder={order.notes_admin ? 'Modifier la note…' : 'Ex : cliente fidèle, adresse à vérifier…'}
                className="flex-1 bg-white border border-[#043672]/15 focus:border-[#b8965a] outline-none px-3 py-2 text-[12px]" />
              <button onClick={saveNotes} disabled={isPending}
                className="text-label text-[7px] tracking-[2px] px-3 py-2 bg-[#043672] text-white disabled:opacity-50">
                {isPending ? '…' : 'Enregistrer'}
              </button>
            </div>
            {msg && <span className="text-[11px] text-emerald-600">{msg}</span>}
          </div>

          {order.why_locht && (
            <div className="flex flex-col gap-3">
              <div className="bg-[#f0ebe0] px-3 py-2">
                <span className="text-label text-[9px] text-[#b8965a] tracking-[2px] block mb-1">Ce qui l&apos;a attiré</span>
                <span className="text-[12px] text-[#1a1a2e] font-light italic">&laquo; {order.why_locht} &raquo;</span>
              </div>
              <NoteColis firstName={order.first_name} bagName={order.bag_name} reference={order.reference} why={order.why_locht} />
            </div>
          )}

          {/* Changer statut */}
          <div className="flex flex-col gap-2">
            <span className="text-label text-[7px] text-[#b8965a] tracking-[2px]">Statut</span>
            <div className="flex flex-wrap gap-1.5">
              {ALL_STATUS.map(s => (
                <button key={s} onClick={() => changeStatus(s)} disabled={isPending || order.status === s}
                  className={`text-label text-[7px] tracking-[1px] px-2.5 py-1.5 border transition-colors disabled:opacity-100 ${
                    order.status === s ? STATUS_COLORS[s] : 'bg-white text-[#7a7a8a] border-[#043672]/15 hover:border-[#043672]/40'
                  }`}>
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Suivi + emails */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex flex-col gap-1 flex-1">
              <span className="text-label text-[7px] text-[#b8965a] tracking-[2px]">Transporteur & n° de suivi</span>
              <div className="flex gap-2">
                <select value={carrier} onChange={e => setCarrier(e.target.value)}
                  className="bg-white border border-[#043672]/15 focus:border-[#b8965a] outline-none px-2 py-2 text-[11px]">
                  <option value="">Transporteur</option>
                  {CARRIERS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input value={tracking} onChange={e => setTracking(e.target.value)} placeholder="Numéro de suivi"
                  className="flex-1 bg-white border border-[#043672]/15 focus:border-[#b8965a] outline-none px-3 py-2 text-[12px]" />
                <button onClick={saveTracking} disabled={isPending}
                  className="text-label text-[7px] tracking-[2px] px-3 py-2 bg-[#043672] text-white disabled:opacity-50">OK</button>
              </div>
              {tracking && trackingUrl(carrier, tracking) && (
                <a href={trackingUrl(carrier, tracking)} target="_blank" rel="noopener noreferrer"
                  className="text-label text-[7px] text-[#b8965a] hover:text-[#043672] tracking-[1px] mt-0.5">
                  Vérifier le lien de suivi →
                </a>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={resend} disabled={isPending}
                className="text-label text-[7px] tracking-[1px] px-3 py-2 border border-[#043672]/20 text-[#043672] hover:bg-[#043672] hover:text-white transition-colors disabled:opacity-50">
                Renvoyer confirmation
              </button>
              <button onClick={() => email('payment')} disabled={isPending}
                className="text-label text-[7px] tracking-[1px] px-3 py-2 border border-[#043672]/20 text-[#043672] hover:bg-[#043672] hover:text-white transition-colors disabled:opacity-50">
                Email paiement
              </button>
              <button onClick={() => email('shipped')} disabled={isPending}
                className="text-label text-[7px] tracking-[1px] px-3 py-2 border border-[#043672]/20 text-[#043672] hover:bg-[#043672] hover:text-white transition-colors disabled:opacity-50">
                Email expédition
              </button>
            </div>
          </div>

          {msg && <span className="text-[11px] text-emerald-600">{msg}</span>}
        </div>
      )}
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-[#7a7a8a] w-[70px] flex-shrink-0">{label}</span>
      <span className="text-[#1a1a2e]">{value}</span>
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
        <button onClick={copy}
          className="text-label text-[9px] tracking-[1px] px-3 py-1.5 border border-[#d4aa6a]/40 text-[#d4aa6a] hover:bg-[#d4aa6a] hover:text-[#021f45] transition-colors">
          {copied ? '✓ Copié' : 'Copier'}
        </button>
      </div>
      <pre className="text-[11px] text-white/70 font-light leading-relaxed whitespace-pre-wrap font-sans">{note}</pre>
    </div>
  )
}
