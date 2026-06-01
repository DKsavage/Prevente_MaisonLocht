'use client'

import { useState, useTransition } from 'react'
import { updateOrderStatus, updateTracking, sendStatusEmail, type OrderStatus } from '@/app/admin/actions'

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
  tracking_number: string | null
  created_at: string
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
  const [orders] = useState(initialOrders)
  const [filter, setFilter] = useState<'all' | OrderStatus>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  return (
    <div className="flex flex-col gap-4">
      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} label={`Toutes (${orders.length})`} />
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
  const [isPending, startTransition] = useTransition()
  const [tracking, setTracking] = useState(order.tracking_number ?? '')
  const [msg, setMsg] = useState<string | null>(null)

  const changeStatus = (status: OrderStatus) => {
    startTransition(async () => {
      await updateOrderStatus(order.reference, status)
      setMsg('Statut mis à jour')
      setTimeout(() => setMsg(null), 2000)
    })
  }

  const saveTracking = () => {
    startTransition(async () => {
      await updateTracking(order.reference, tracking)
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

  const date = new Date(order.created_at).toLocaleDateString('fr-CA', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div className={`border bg-[#faf7f2] transition-colors ${expanded ? 'border-[#b8965a]/40' : 'border-[#043672]/10'}`}>
      {/* Ligne principale */}
      <button onClick={onToggle} className="w-full flex items-center gap-4 px-4 py-3 text-left">
        <span className="font-mono text-[11px] text-[#043672] w-[120px] flex-shrink-0">{order.reference}</span>
        <span className="text-[13px] text-[#1a1a2e] flex-1 min-w-0 truncate">{order.first_name} {order.last_name}</span>
        <span className="hidden md:block text-[11px] text-[#7a7a8a] w-[60px]">{order.country ?? '—'}</span>
        <span className="hidden sm:block text-[12px] text-[#043672] w-[90px] text-right">{order.price_total} CAD</span>
        <span className={`text-label text-[7px] tracking-[1px] px-2 py-1 border ${STATUS_COLORS[order.status]} w-[110px] text-center flex-shrink-0`}>
          {STATUS_LABELS[order.status]}
        </span>
        <span className="hidden md:block text-[10px] text-[#7a7a8a] w-[80px] text-right">{date}</span>
      </button>

      {/* Détails */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-[#043672]/06 flex flex-col gap-4">
          <div className="grid md:grid-cols-2 gap-4 text-[12px]">
            <div className="flex flex-col gap-1">
              <Detail label="Pièces" value={order.bag_name} />
              <Detail label="Quantité" value={String(order.quantity)} />
              <Detail label="Total" value={`${order.price_total} CAD`} />
            </div>
            <div className="flex flex-col gap-1">
              <Detail label="Courriel" value={order.email} />
              <Detail label="Téléphone" value={order.phone ?? '—'} />
              <Detail label="Adresse" value={`${order.address}, ${order.city}${order.province ? ', ' + order.province : ''} ${order.postal_code}, ${order.country ?? ''}`} />
            </div>
          </div>

          {order.why_locht && (
            <div className="bg-[#f0ebe0] px-3 py-2">
              <span className="text-label text-[7px] text-[#b8965a] tracking-[2px] block mb-1">Ce qui l&apos;a attiré</span>
              <span className="text-[12px] text-[#1a1a2e] font-light italic">&laquo; {order.why_locht} &raquo;</span>
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
              <span className="text-label text-[7px] text-[#b8965a] tracking-[2px]">N° de suivi</span>
              <div className="flex gap-2">
                <input value={tracking} onChange={e => setTracking(e.target.value)} placeholder="Numéro de suivi"
                  className="flex-1 bg-white border border-[#043672]/15 focus:border-[#b8965a] outline-none px-3 py-2 text-[12px]" />
                <button onClick={saveTracking} disabled={isPending}
                  className="text-label text-[7px] tracking-[2px] px-3 py-2 bg-[#043672] text-white disabled:opacity-50">OK</button>
              </div>
            </div>
            <div className="flex gap-2">
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
