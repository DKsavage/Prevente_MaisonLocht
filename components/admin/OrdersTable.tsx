'use client'

import { useState, useTransition, useMemo, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { updateOrderStatus, updateTracking, updateNotes, sendStatusEmail, resendConfirmation, sendCorrectionEmail, getOrderPieces } from '@/app/admin/actions'
import { timeAgo } from '@/lib/time'
import { CARRIERS, trackingUrl } from '@/lib/carriers'
import {
  type OrderStatus, ALL_STATUS, STATUS_FLOW,
  STATUS_LABEL, STATUS_SHORT, STATUS_PILL, STATUS_LEFT_COLOR,
} from '@/lib/order-status'

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

function exportCsv(orders: Order[]) {
  const headers = ['Référence', 'Statut', 'Prénom', 'Nom', 'Email', 'Téléphone', 'Pièces', 'Quantité', 'Total', 'Adresse', 'Ville', 'Province', 'Code postal', 'Pays', 'Suivi', 'Date']
  const fmtDate = (d: string) => {
    const dt = new Date(d)
    return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`
  }
  const rows = orders.map(o => [
    o.reference, STATUS_LABEL[o.status] ?? o.status, o.first_name, o.last_name, o.email, o.phone ?? '', o.bag_name,
    o.quantity, o.price_total, o.address, o.city, o.province ?? '', o.postal_code, o.country ?? '',
    o.tracking_number ?? '', fmtDate(o.created_at),
  ])
  const esc = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`
  const csv = '﻿' + [headers, ...rows].map(r => r.map(esc).join(';')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `maison-locht-commandes-${new Date().toISOString().slice(0,10)}.csv`
  a.click(); URL.revokeObjectURL(url)
}

export default function OrdersTable({ initialOrders }: { initialOrders: Order[] }) {
  const router = useRouter()
  const orders = initialOrders
  const [filter, setFilter] = useState<'all' | OrderStatus | 'late'>('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 30000)
    return () => clearInterval(id)
  }, [router])

  const lateCount = orders.filter(isLate).length
  const filtered = useMemo(() => {
    let list = filter === 'all' ? orders : filter === 'late' ? orders.filter(isLate) : orders.filter(o => o.status === filter)
    const q = query.trim().toLowerCase()
    if (q) list = list.filter(o =>
      o.reference.toLowerCase().includes(q) ||
      `${o.first_name} ${o.last_name}`.toLowerCase().includes(q) ||
      o.email.toLowerCase().includes(q))
    return [...list].sort((a, b) => {
      switch (sort) {
        case 'date_asc':    return +new Date(a.created_at) - +new Date(b.created_at)
        case 'amount_desc': return Number(b.price_total) - Number(a.price_total)
        case 'amount_asc':  return Number(a.price_total) - Number(b.price_total)
        default:            return +new Date(b.created_at) - +new Date(a.created_at)
      }
    })
  }, [orders, filter, query, sort])

  return (
    <div className="flex flex-col gap-4">
      {/* Barre recherche + contrôles */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <input
          value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Référence, nom ou email…"
          className="flex-1 max-w-md bg-[#faf7f2] border border-[#043672]/12 focus:border-[#b8965a] outline-none px-4 py-2.5 text-[12px] transition-all duration-200 placeholder:text-[#7a7a8a]/60"
        />
        <div className="flex items-center gap-2">
          <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}
            className="text-label text-[10px] tracking-[1px] px-3 py-2.5 border border-[#043672]/15 bg-[#faf7f2] text-[#043672] outline-none focus:border-[#b8965a] transition-all duration-200">
            <option value="date_desc">Plus récentes</option>
            <option value="date_asc">Plus anciennes</option>
            <option value="amount_desc">Montant ↓</option>
            <option value="amount_asc">Montant ↑</option>
          </select>
          <button onClick={() => router.refresh()}
            className="text-label text-[10px] tracking-[2px] px-4 py-2.5 border border-[#043672]/15 text-[#043672] hover:bg-[#043672] hover:text-white transition-all duration-200 whitespace-nowrap">
            ↻
          </button>
          <button onClick={() => exportCsv(filtered)}
            className="text-label text-[10px] tracking-[2px] px-4 py-2.5 border border-[#043672]/15 text-[#043672] hover:bg-[#043672] hover:text-white transition-all duration-200 whitespace-nowrap">
            CSV ({filtered.length})
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-1.5">
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} label={`Toutes (${orders.length})`} />
        {lateCount > 0 && (
          <button onClick={() => setFilter('late')}
            className={`text-label text-[10px] tracking-[2px] px-3 py-1.5 border transition-all duration-200 ${
              filter === 'late' ? 'bg-red-500 text-white border-red-500' : 'bg-red-50/60 text-red-600 border-red-200 hover:border-red-400'
            }`}>
            ⚠ En retard ({lateCount})
          </button>
        )}
        {ALL_STATUS.map(s => {
          const n = orders.filter(o => o.status === s).length
          if (n === 0) return null
          return <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)} label={`${STATUS_LABEL[s]} (${n})`} />
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-[13px] text-[#7a7a8a] font-light border border-dashed border-[#043672]/12">
          Aucune commande.
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
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
      className={`text-label text-[10px] tracking-[2px] px-3 py-1.5 border transition-all duration-200 ${
        active ? 'bg-[#043672] text-white border-[#043672]' : 'bg-[#faf7f2] text-[#7a7a8a] border-[#043672]/12 hover:border-[#043672]/35 hover:text-[#043672]'
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
  const rowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (expanded && !piecesLoaded) {
      getOrderPieces(order.reference).then(p => {
        setPieces(p as PieceItem[])
        setPiecesLoaded(true)
      })
    }
    if (expanded) setTimeout(() => rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80)
  }, [expanded, piecesLoaded, order.reference])

  const fullAddress = `${order.first_name} ${order.last_name}\n${order.address}\n${order.city}${order.province ? ', ' + order.province : ''} ${order.postal_code}\n${order.country ?? ''}`

  const feedback = (text: string) => { setMsg(text); setTimeout(() => setMsg(null), 3000) }

  const copyAddress = () => { navigator.clipboard.writeText(fullAddress); feedback('Adresse copiée') }

  const saveNotes = () => startTransition(async () => {
    await updateNotes(order.reference, notes); router.refresh(); feedback('Note enregistrée')
  })

  const changeStatus = (status: OrderStatus) => {
    const confirmMsg: Partial<Record<OrderStatus, string>> = {
      payment_received: `Confirmer le paiement de ${order.first_name} ${order.last_name} ?\n\nEmail "Paiement confirmé" envoyé automatiquement.`,
      shipped:          `Marquer comme expédiée pour ${order.first_name} ${order.last_name} ?\n\nEmail "En route" envoyé automatiquement.`,
      cancelled:        `Annuler la commande ${order.reference} ?\n\nLes pièces seront libérées.`,
    }
    const c = confirmMsg[status]
    if (c && !window.confirm(c)) return
    startTransition(async () => {
      await updateOrderStatus(order.reference, status)
      router.refresh()
      feedback(status === 'payment_received' || status === 'shipped' ? 'Statut mis à jour · email envoyé' : 'Statut mis à jour')
    })
  }

  const saveTracking = () => startTransition(async () => {
    await updateTracking(order.reference, tracking, carrier); router.refresh(); feedback('Suivi enregistré')
  })

  const sendEmail = (kind: 'payment' | 'shipped') => {
    const label = kind === 'payment' ? 'Paiement confirmé' : 'Commande expédiée'
    if (!window.confirm(`Renvoyer manuellement "${label}" à ${order.first_name} (${order.email}) ?`)) return
    startTransition(async () => {
      try { await sendStatusEmail(order.reference, kind); feedback(`Email "${label}" envoyé`) }
      catch { feedback('Échec email') }
    })
  }

  const resend = () => {
    if (!window.confirm(`Renvoyer la confirmation à ${order.first_name} (${order.email}) ?`)) return
    startTransition(async () => {
      try { await resendConfirmation(order.reference); feedback('Confirmation renvoyée') }
      catch { feedback('Échec email') }
    })
  }

  const correction = () => {
    if (!window.confirm(`Envoyer un email de CORRECTION à ${order.first_name} (${order.email}) ?\n\nExplique l'erreur et rappelle les instructions de paiement.`)) return
    startTransition(async () => {
      try { await sendCorrectionEmail(order.reference); feedback('Email de correction envoyé') }
      catch { feedback('Échec envoi') }
    })
  }

  const dateExact = new Date(order.created_at).toLocaleDateString('fr-CA', { day: '2-digit', month: 'short', year: 'numeric' })
  const date = timeAgo(order.created_at)
  // Référence courte pour mobile : LOCHT-2026-009 → #009
  const refShort = `#${order.reference.split('-').pop()}`
  const bagChip = order.bag_name.replace(/Le /g, '').replace(/, /g, ' · ')

  return (
    <div
      ref={rowRef}
      className={`border-l-[3px] border-r border-t border-b transition-all duration-300 ${
        isPending ? 'opacity-75' : ''
      } ${late ? 'bg-amber-50/25' : expanded ? 'bg-[#faf7f2]' : 'bg-[#faf7f2] hover:bg-[#f5f1eb]'} ${
        expanded ? 'border-r-[#b8965a]/25 border-t-[#b8965a]/25 border-b-[#b8965a]/25' : 'border-r-[#043672]/08 border-t-[#043672]/08 border-b-[#043672]/08'
      }`}
      style={{ borderLeftColor: STATUS_LEFT_COLOR[order.status] }}
    >
      {/* Barre de chargement fine — visible pendant les transitions */}
      <AnimatePresence>
        {isPending && (
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="h-[2px] origin-left"
            style={{ background: 'linear-gradient(90deg, #b8965a, #d4aa6a, #b8965a)', backgroundSize: '200% 100%' }}
          />
        )}
      </AnimatePresence>

      {/* ── Ligne principale ── */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        <button onClick={onToggle} className="flex items-center gap-3 flex-1 min-w-0 text-left">
          {late && <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 animate-pulse" title="Paiement en retard" />}

          {/* Référence : courte sur mobile, complète sur sm+ */}
          <span className="font-mono flex-shrink-0">
            <span className="sm:hidden text-[10px] text-[#043672]/50 tracking-[0.5px]">{refShort}</span>
            <span className="hidden sm:inline text-[10px] text-[#043672]/50 w-[112px] tracking-[0.5px]">{order.reference}</span>
          </span>

          <span className="text-[13px] font-light text-[#1a1a2e] flex-1 min-w-0 truncate">
            {order.first_name} {order.last_name}
            {order.notes_admin && <span className="ml-1.5 text-[#b8965a] text-[11px]" title="Note interne">✎</span>}
          </span>

          <span className="hidden md:inline-block text-[9px] tracking-[1px] uppercase px-2 py-0.5 bg-[#b8965a]/08 text-[#9a7a3a] border border-[#b8965a]/18 flex-shrink-0 whitespace-nowrap">
            {bagChip}
          </span>
          <span className="hidden md:block text-[11px] text-[#7a7a8a] w-[32px] text-center flex-shrink-0">{order.country ?? '—'}</span>
          <span className="text-[13px] text-[#043672] font-medium w-[78px] text-right flex-shrink-0 hidden sm:block">{order.price_total} CAD</span>
        </button>

        {order.status === 'pending' && (
          <button onClick={() => changeStatus('payment_received')} disabled={isPending}
            className="flex-shrink-0 flex items-center gap-1.5 text-[9px] tracking-[1px] uppercase font-medium px-3 py-2 bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all duration-200 disabled:opacity-40"
            title="Confirmer la réception du paiement">
            <span>✓</span>
            <span className="hidden sm:block">Payée</span>
          </button>
        )}

        <button onClick={onToggle} className="flex items-center gap-3 flex-shrink-0">
          <span className={`text-label text-[9px] tracking-[1px] px-2.5 py-1.5 border transition-all duration-200 ${STATUS_PILL[order.status]} min-w-[98px] text-center`}>
            {STATUS_LABEL[order.status]}
          </span>
          <span className="hidden lg:block text-[10px] text-[#7a7a8a] w-[68px] text-right" title={dateExact}>{date}</span>
        </button>
      </div>

      {/* ── Détails expandés ── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
            className="border-t border-[#043672]/06"
          >
            <div className="px-4 pb-6 pt-4">
              {/* 2 colonnes desktop — sur mobile : ACTIONS d'abord, infos ensuite */}
              <div className="grid md:grid-cols-[1fr_296px] lg:grid-cols-[1fr_320px] gap-6">

                {/* ── Colonne droite : ACTIONS (order-1 = première sur mobile) ── */}
                <div className="order-1 md:order-2 flex flex-col gap-5 md:border-l md:border-[#043672]/07 md:pl-6">

                  <StatusStepper currentStatus={order.status} onAdvance={changeStatus} isPending={isPending} />

                  {order.status !== 'cancelled' && order.status !== 'shipped' && (
                    <button onClick={() => changeStatus('cancelled')} disabled={isPending}
                      className="text-label text-[9px] tracking-[1px] px-3 py-1.5 border border-red-200 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200 disabled:opacity-40 self-start">
                      Annuler la commande
                    </button>
                  )}

                  {/* Expédition */}
                  <div className="flex flex-col gap-2">
                    <SectionLabel>Expédition & suivi</SectionLabel>
                    <div className="flex gap-2">
                      <select value={carrier} onChange={e => setCarrier(e.target.value)}
                        className="bg-white border border-[#043672]/10 focus:border-[#b8965a] outline-none px-2 py-2 text-[11px] flex-shrink-0 transition-all duration-200">
                        <option value="">Transporteur</option>
                        {CARRIERS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <input value={tracking} onChange={e => setTracking(e.target.value)} placeholder="N° de suivi"
                        className="flex-1 bg-white border border-[#043672]/10 focus:border-[#b8965a] outline-none px-3 py-2 text-[12px] min-w-0 transition-all duration-200" />
                      <button onClick={saveTracking} disabled={isPending}
                        className="text-label text-[9px] tracking-[1px] px-3 py-2 bg-[#043672] text-white disabled:opacity-40 flex-shrink-0 hover:bg-[#0a4d9e] transition-all duration-200">
                        OK
                      </button>
                    </div>
                    {tracking && trackingUrl(carrier, tracking) && (
                      <a href={trackingUrl(carrier, tracking)!} target="_blank" rel="noopener noreferrer"
                        className="text-label text-[9px] text-[#b8965a] hover:text-[#043672] tracking-[1px] underline underline-offset-2 transition-colors self-start">
                        Vérifier →
                      </a>
                    )}
                  </div>

                  {/* Communications */}
                  <div className="flex flex-col gap-2">
                    <SectionLabel>Communications client</SectionLabel>
                    <div className="flex flex-col gap-1">
                      <EmailBtn onClick={resend} disabled={isPending} title="Renvoie la confirmation originale avec instructions de paiement">↩ Renvoyer confirmation</EmailBtn>
                      <EmailBtn onClick={() => sendEmail('payment')} disabled={isPending} title="Renvoie l'email Paiement confirmé">↩ Renvoyer : Paiement confirmé</EmailBtn>
                      <EmailBtn onClick={() => sendEmail('shipped')} disabled={isPending} title="Renvoie l'email Commande expédiée">↩ Renvoyer : Commande expédiée</EmailBtn>
                      <div className="h-px bg-[#043672]/07 my-0.5" />
                      <button onClick={correction} disabled={isPending}
                        title="Email d'excuse pour un envoi erroné"
                        className="text-left text-label text-[9px] tracking-[1px] px-3 py-2 border border-[#b8965a]/30 text-[#b8965a] hover:bg-[#b8965a] hover:text-white transition-all duration-200 disabled:opacity-40">
                        ⚠ Email correction (envoi erroné)
                      </button>
                    </div>
                  </div>

                  {/* Feedback */}
                  <AnimatePresence>
                    {msg && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="px-3 py-2 bg-emerald-50 border border-emerald-200 border-l-2 border-l-emerald-400">
                        <p className="text-[11px] text-emerald-700 font-light">{msg}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ── Colonne gauche : INFOS (order-2 = seconde sur mobile) ── */}
                <div className="order-2 md:order-1 flex flex-col gap-5">

                  {/* Photos — lazy load, hover zoom */}
                  {pieces.length > 0 && (
                    <div className="flex flex-col gap-2.5">
                      <SectionLabel>Pièces commandées</SectionLabel>
                      <div className="flex gap-4 flex-wrap">
                        {pieces.map(p => (
                          <div key={p.id} className="flex flex-col gap-1.5 group">
                            <div className="overflow-hidden w-24 h-24 border border-[#043672]/10 group-hover:border-[#b8965a]/40 transition-all duration-300">
                              <img src={p.image_url} alt={MODEL_NAMES[p.model] ?? p.model}
                                loading="lazy" decoding="async"
                                className="w-24 h-24 object-cover transition-transform duration-500 group-hover:scale-105" />
                            </div>
                            <p className="text-[10px] font-light text-[#043672] italic leading-tight">{MODEL_NAMES[p.model] ?? p.model}</p>
                            <p className="text-label text-[8px] text-[#b8965a] tracking-[1px]">Pièce N°{String(p.display_num).padStart(2,'0')}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Infos commande + client */}
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
                          <span className="font-mono text-[11px] text-[#043672] bg-[#b8965a]/10 border border-[#b8965a]/22 px-2 py-0.5 tracking-[1px]">{order.interac_answer}</span>
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
                            {order.address}<br />{order.city}{order.province ? `, ${order.province}` : ''} {order.postal_code}<br />{order.country ?? ''}
                          </p>
                          <button onClick={copyAddress}
                            className="mt-1.5 text-label text-[9px] text-[#b8965a] hover:text-[#043672] tracking-[1px] border border-[#b8965a]/22 px-2 py-0.5 transition-all duration-200">
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
                      <NoteColis firstName={order.first_name} bagName={order.bag_name} why={order.why_locht} />
                    </div>
                  )}

                  {/* Notes admin */}
                  <div className="flex flex-col gap-1.5">
                    <SectionLabel>Note interne (privée)</SectionLabel>
                    {order.notes_admin && (
                      <div className="bg-[#043672]/03 border-l-2 border-[#b8965a]/40 px-3 py-2 mb-1">
                        <p className="text-[11px] text-[#043672] font-light italic">{order.notes_admin}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input value={notes} onChange={e => setNotes(e.target.value)}
                        placeholder={order.notes_admin ? 'Modifier…' : 'Cliente fidèle, adresse à vérifier…'}
                        className="flex-1 bg-white border border-[#043672]/10 focus:border-[#b8965a] outline-none px-3 py-2 text-[12px] min-w-0 transition-all duration-200" />
                      <button onClick={saveNotes} disabled={isPending}
                        className="text-label text-[9px] tracking-[1px] px-4 py-2 bg-[#043672] text-white disabled:opacity-40 flex-shrink-0 hover:bg-[#0a4d9e] transition-all duration-200">
                        {isPending ? '…' : 'Sauver'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Composants utilitaires ──

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-label text-[10px] text-[#b8965a] tracking-[2px] uppercase block mb-0.5">{children}</span>
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-2 items-baseline">
      <span className="text-[#7a7a8a] text-[11px] w-[72px] flex-shrink-0">{label}</span>
      <span className={`text-[#1a1a2e] text-[11px] font-light leading-relaxed ${mono ? 'font-mono tracking-[0.5px]' : ''}`}>{value}</span>
    </div>
  )
}

function EmailBtn({ onClick, disabled, title, children }: {
  onClick: () => void; disabled: boolean; title?: string; children: React.ReactNode
}) {
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      className="text-left text-label text-[9px] tracking-[1px] px-3 py-2 border border-[#043672]/10 text-[#043672] hover:bg-[#043672] hover:text-white transition-all duration-200 disabled:opacity-40">
      {children}
    </button>
  )
}

function StatusStepper({ currentStatus, onAdvance, isPending }: {
  currentStatus: OrderStatus; onAdvance: (s: OrderStatus) => void; isPending: boolean
}) {
  const currentIdx = STATUS_FLOW.indexOf(currentStatus)
  if (currentStatus === 'cancelled') {
    return (
      <div className="flex flex-col gap-2">
        <SectionLabel>Progression commande</SectionLabel>
        <div className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 self-start">
          <span className="w-2 h-2 rounded-full bg-red-400" />
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
          const isPast = i < currentIdx, isCurrent = i === currentIdx, isNext = i === currentIdx + 1
          return (
            <div key={s} className="flex items-center flex-shrink-0">
              {i > 0 && <div className={`h-px w-4 mt-[-22px] flex-shrink-0 transition-colors duration-300 ${isPast ? 'bg-emerald-400' : 'bg-[#043672]/12'}`} />}
              <button disabled={isPending || !isNext} onClick={() => onAdvance(s)}
                title={isNext ? `Avancer → ${STATUS_LABEL[s]}` : STATUS_LABEL[s]}
                className={`flex flex-col items-center gap-1.5 px-1.5 transition-opacity duration-200 ${isNext ? 'cursor-pointer' : 'cursor-default'} ${!isPast && !isCurrent && !isNext ? 'opacity-25' : ''}`}>
                <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-[11px] font-medium transition-all duration-300 ${
                  isPast    ? 'bg-emerald-50 border-emerald-400 text-emerald-600' :
                  isCurrent ? 'bg-[#043672] border-[#043672] text-white shadow-sm' :
                  isNext    ? 'bg-white border-[#043672]/30 text-[#7a7a8a] hover:border-[#043672] hover:bg-[#043672]/04 hover:text-[#043672]' :
                              'bg-white border-[#043672]/10 text-[#043672]/20'
                }`}>
                  {isPast ? '✓' : i + 1}
                </div>
                <span className={`text-[8px] tracking-[0.5px] uppercase font-medium text-center leading-tight max-w-[52px] transition-colors duration-200 ${
                  isCurrent ? 'text-[#043672]' : isPast ? 'text-emerald-600' : isNext ? 'text-[#7a7a8a]' : 'text-[#043672]/22'
                }`}>{STATUS_SHORT[s]}</span>
              </button>
            </div>
          )
        })}
      </div>
      {currentIdx < STATUS_FLOW.length - 1 && (
        <p className="text-[10px] text-[#7a7a8a]/70 font-light">Cliquer sur l&apos;étape suivante pour avancer.</p>
      )}
    </div>
  )
}

function NoteColis({ firstName, bagName, why }: {
  firstName: string; bagName: string; why: string
}) {
  const [copied, setCopied] = useState(false)
  const note = `${firstName},\n\nTon ${bagName} est là.\nUnique — jamais reproduit.\n\nTu nous avais confié :\n« ${why} »\n\nC'est pour ça qu'il est à toi.\n\n— Maison Locht`

  const copy = () => { navigator.clipboard.writeText(note); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  return (
    <div className="bg-[#021f45] px-4 py-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-label text-[9px] text-[#d4aa6a] tracking-[3px]">Note à glisser dans le colis</span>
        <button onClick={copy}
          className="text-label text-[9px] tracking-[1px] px-3 py-1.5 border border-[#d4aa6a]/35 text-[#d4aa6a] hover:bg-[#d4aa6a] hover:text-[#021f45] transition-all duration-200">
          {copied ? '✓ Copié' : 'Copier'}
        </button>
      </div>
      <pre className="text-[11px] text-white/65 font-light leading-relaxed whitespace-pre-wrap font-sans">{note}</pre>
    </div>
  )
}
