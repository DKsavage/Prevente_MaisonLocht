'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import type { OrderFormData } from '@/lib/schemas'
import type { SelectedPiece } from './FormStep1'

const ease = [0.16, 1, 0.3, 1] as const

const copy = {
  fr: {
    title: 'Confirmez votre commande',
    sub: 'Vérifiez les informations avant de confirmer.',
    sac: 'Sac', qty: 'Quantité', total: 'Total',
    name: 'Nom', email: 'Courriel', address: 'Adresse',
    paymentTitle: 'Paiement par virement Interac',
    paymentDesc: 'Après confirmation, vous recevrez par email un code de référence et les instructions de paiement.',
    back: 'Retour', confirm: 'Confirmer la commande',
    loading: 'Envoi en cours...',
    unique: 'Pièce unique · jamais reproduite',
  },
  en: {
    title: 'Confirm your order',
    sub: 'Review your information before confirming.',
    sac: 'Bag', qty: 'Quantity', total: 'Total',
    name: 'Name', email: 'Email', address: 'Address',
    paymentTitle: 'Payment by Interac transfer',
    paymentDesc: 'After confirmation, you will receive a reference code and payment instructions by email.',
    back: 'Back', confirm: 'Confirm order',
    loading: 'Sending...',
    unique: 'One-of-a-kind · never reproduced',
  },
}

type Props = {
  data: Partial<OrderFormData>
  selections: SelectedPiece[]
  lang: 'fr' | 'en'
  loading: boolean
  onBack: () => void
  onSubmit: () => void
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-baseline border-b border-[#043672]/06 py-3 last:border-0">
    <span className="text-label text-[8px] text-[#7a7a8a] tracking-[3px]">{label}</span>
    <span className="text-[13px] text-[#043672] font-light text-right max-w-[60%]">{value}</span>
  </div>
)

export default function FormStep3({ data, selections, lang, loading, onBack, onSubmit }: Props) {
  const t = copy[lang]

  return (
    <motion.div
      className="flex flex-col gap-7"
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease }}
    >
      <div>
        <h3 className="font-display text-[28px] md:text-[34px] font-light text-[#043672] mb-1">{t.title}</h3>
        <p className="text-[12px] text-[#7a7a8a] font-light">{t.sub}</p>
      </div>

      {/* Photos des pièces sélectionnées */}
      <div className={`grid gap-4 ${selections.length === 2 ? 'grid-cols-2' : 'grid-cols-1 max-w-[280px]'}`}>
        {selections.map((piece) => (
          <motion.div
            key={piece.id}
            className="flex flex-col gap-2"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
          >
            <div className="relative aspect-square overflow-hidden border border-[#b8965a]/30 bg-[#f0ebe0] shadow-[4px_4px_0_rgba(4,54,114,0.06)]">
              <Image
                src={piece.src}
                alt={`${piece.modelName} N°${String(piece.pieceNum).padStart(2, '0')}`}
                fill className="object-cover"
                sizes="(max-width: 768px) 45vw, 260px"
                priority
              />
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-[#043672]/30 to-transparent h-10 pointer-events-none" />
              <div className="absolute top-2.5 left-2.5 bg-[#faf7f2]/90 backdrop-blur-sm px-2 py-1">
                <span className="text-label text-[7px] text-[#043672] tracking-[2px]">
                  N°{String(piece.pieceNum).padStart(2, '0')}
                </span>
              </div>
            </div>
            <div className="flex items-baseline justify-between px-0.5">
              <span className="font-display text-[18px] font-light text-[#043672]">{piece.modelName}</span>
              <span className="text-label text-[9px] text-[#7a7a8a] tracking-[2px]">{piece.price} CAD</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Total */}
        <div className="bg-[#f0ebe0] p-5 flex flex-col gap-3">
          <p className="text-label text-[8px] text-[#b8965a] tracking-[4px]">{lang === 'fr' ? 'Commande' : 'Order'}</p>
          <Row label={t.qty} value={String(data.quantity ?? 1)} />
          <div className="flex justify-between items-baseline pt-3 border-t-2 border-[#043672]/10">
            <span className="text-label text-[9px] text-[#043672] tracking-[3px]">{t.total}</span>
            <span className="font-display text-[26px] font-light text-[#043672]">{data.priceTotal} <span className="text-[14px] text-[#7a7a8a]">CAD</span></span>
          </div>
          <span className="text-label text-[7px] text-[#b8965a] tracking-[2px] flex items-center gap-1.5">
            <span className="text-[6px]">✦</span>{t.unique}
          </span>
        </div>

        {/* Infos client */}
        <div className="flex flex-col gap-1">
          <p className="text-label text-[8px] text-[#b8965a] tracking-[4px] mb-2">{lang === 'fr' ? 'Livraison' : 'Delivery'}</p>
          <Row label={t.name}    value={`${data.firstName} ${data.lastName}`} />
          <Row label={t.email}   value={data.email ?? ''} />
          <Row label={t.address} value={`${data.address}, ${data.city} ${data.province} ${data.postalCode}`} />
        </div>
      </div>

      {/* Paiement */}
      <div className="bg-[#043672]/04 border border-[#043672]/10 p-5 flex gap-4">
        <span className="text-[#b8965a] text-lg flex-shrink-0 mt-0.5">✦</span>
        <div>
          <p className="text-label text-[9px] text-[#043672] tracking-[3px] mb-1.5">{t.paymentTitle}</p>
          <p className="text-[12px] text-[#7a7a8a] font-light leading-relaxed">{t.paymentDesc}</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2 border-t border-[#043672]/08">
        <button
          onClick={onBack}
          disabled={loading}
          className="text-label text-[9px] text-[#7a7a8a] tracking-[3px] hover:text-[#043672] transition-colors duration-200 flex items-center gap-2 cursor-none disabled:opacity-40"
          data-cursor="hover"
        >
          ← {t.back}
        </button>

        <button
          onClick={onSubmit}
          disabled={loading}
          className="group relative inline-flex items-center gap-4 bg-[#043672] text-white overflow-hidden px-8 py-4 cursor-none disabled:opacity-60"
          data-cursor="hover"
        >
          <span className="absolute inset-0 bg-[#0a4d9e] -translate-x-full group-hover:translate-x-0 transition-transform duration-[420ms] ease-[cubic-bezier(.16,1,.3,1)] group-disabled:hidden" />
          <span className="relative text-label text-[9px] tracking-[3px]">
            {loading ? t.loading : t.confirm}
          </span>
          {!loading && <span className="relative text-sm group-hover:translate-x-1.5 transition-transform duration-300">→</span>}
        </button>
      </div>
    </motion.div>
  )
}
