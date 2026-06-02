'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateOrderStatus, type OrderStatus } from '@/app/admin/actions'

const NEXT: Partial<Record<string, { label: string; status: OrderStatus; style: string }>> = {
  pending:          { label: '✓ Payé',     status: 'payment_received', style: 'border-emerald-300 text-emerald-700 hover:bg-emerald-500 hover:text-white hover:border-emerald-500' },
  payment_received: { label: '✓ Confirmer', status: 'confirmed',        style: 'border-blue-300 text-blue-700 hover:bg-blue-500 hover:text-white hover:border-blue-500' },
  confirmed:        { label: '✓ Expédier',  status: 'shipped',          style: 'border-[#043672]/30 text-[#043672] hover:bg-[#043672] hover:text-white' },
}

export default function QuickAction({ reference, status }: { reference: string; status: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const next = NEXT[status]
  if (!next) return null

  return (
    <button
      onClick={e => {
        e.preventDefault()
        startTransition(async () => {
          await updateOrderStatus(reference, next.status)
          router.refresh()
        })
      }}
      disabled={isPending}
      className={`text-label text-[9px] tracking-[1px] px-2.5 py-1.5 border transition-colors disabled:opacity-40 flex-shrink-0 whitespace-nowrap ${next.style}`}
    >
      {isPending ? '…' : next.label}
    </button>
  )
}
