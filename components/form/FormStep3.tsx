'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import type { OrderFormData } from '@/lib/schemas'
import type { SelectedPiece } from './FormStep1'
import { COUNTRIES } from '@/lib/countries'
import { getPaymentMethod } from '@/lib/payment'

const ease = [0.16, 1, 0.3, 1] as const

const copy = {
  fr: {
    title: 'Votre commande',
    sub: 'Un dernier regard avant de confirmer.',
    pieces: 'Vos pièces', qty: 'Quantité', total: 'Total',
    delivery: 'Livraison', recipient: 'Destinataire',
    paymentTitle: 'Paiement par virement Interac',
    paymentDesc: 'Après confirmation, un code de référence et les instructions de paiement vous seront envoyés par courriel.',
    back: 'Retour', confirm: 'Confirmer la commande', loading: 'Envoi…',
    unique: 'Pièce unique · jamais reproduite',
    piece: 'Pièce', engagement: 'Chaque pièce est cousue à la main et ne sera jamais reproduite.',
    finalSale: 'Chaque création est définitive. Les ajustements sont assurés à vie.',
  },
  en: {
    title: 'Your order',
    sub: 'One last look before confirming.',
    pieces: 'Your pieces', qty: 'Quantity', total: 'Total',
    delivery: 'Delivery', recipient: 'Recipient',
    paymentTitle: 'Payment by Interac transfer',
    paymentDesc: 'After confirmation, a reference code and payment instructions will be sent to you by email.',
    back: 'Back', confirm: 'Confirm order', loading: 'Sending…',
    unique: 'One-of-a-kind · never reproduced',
    piece: 'Piece', engagement: 'Each piece is hand-sewn and will never be reproduced.',
    finalSale: 'Each creation is final. Adjustments are guaranteed for life.',
  },
}

type Props = {
  data: Partial<OrderFormData>
  selections: SelectedPiece[]
  lang: 'fr' | 'en'
  loading: boolean
  onBack: () => void
  onSubmit: () => void
  onEdit: (step: number) => void
}

const editLabel = (lang: 'fr' | 'en') => (lang === 'fr' ? 'Modifier' : 'Edit')

export default function FormStep3({ data, selections, lang, loading, onBack, onSubmit, onEdit }: Props) {
  const t = copy[lang]
  const countryName = COUNTRIES.find(c => c.code === data.country)
  const countryLabel = countryName ? (lang === 'fr' ? countryName.name : countryName.nameEn) : data.country
  const payMethod = getPaymentMethod(data.country ?? '')

  return (
    <motion.div
      className="flex flex-col gap-8"
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease }}
    >
      <div>
        <h3 className="font-display text-[28px] md:text-[34px] font-light text-[#043672] mb-1">{t.title}</h3>
        <p className="text-[12px] text-[#7a7a8a] font-light">{t.sub}</p>
      </div>

      {/* ── Showcase des pièces ── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="w-1 h-3 bg-[#b8965a]/60 flex-shrink-0" />
          <span className="text-label text-[8px] text-[#043672] tracking-[5px]">{t.pieces}</span>
          <span className="flex-1 h-px bg-[#043672]/06" />
          <button onClick={() => onEdit(0)} data-cursor="hover"
            className="text-label text-[8px] text-[#7a7a8a] hover:text-[#b8965a] tracking-[2px] transition-colors cursor-none">
            {editLabel(lang)}
          </button>
        </div>

        <div className={`grid gap-5 ${selections.length === 2 ? 'grid-cols-2' : 'grid-cols-1 max-w-[300px] mx-auto md:mx-0'}`}>
          {selections.map((piece, i) => (
            <motion.div
              key={piece.id}
              className="group relative"
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: i * 0.12, ease }}
            >
              {/* Cadre photo avec ombre éditoriale */}
              <div className="relative aspect-[4/5] overflow-hidden bg-[#f0ebe0] shadow-[8px_8px_0_rgba(4,54,114,0.06)]">
                <Image
                  src={piece.src}
                  alt={`${piece.modelName} N°${String(piece.pieceNum).padStart(2, '0')}`}
                  fill className="object-cover"
                  sizes="(max-width: 768px) 45vw, 280px"
                  priority
                />
                {/* Voile bas pour lisibilité */}
                <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#021f45]/85 via-[#021f45]/20 to-transparent pointer-events-none" />

                {/* Tag N° en haut */}
                <div className="absolute top-3 left-3 bg-[#faf7f2]/90 backdrop-blur-sm px-2.5 py-1">
                  <span className="text-label text-[7px] text-[#043672] tracking-[2px]">
                    {t.piece} N°{String(piece.pieceNum).padStart(2, '0')}
                  </span>
                </div>

                {/* Nom + prix en bas sur le voile */}
                <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
                  <div className="flex flex-col">
                    <span className="font-display text-[22px] font-light text-white leading-none italic">{piece.modelName}</span>
                    <span className="text-label text-[7px] text-[#d4aa6a] tracking-[3px] mt-1.5 flex items-center gap-1.5">
                      <span className="text-[6px]">✦</span>{lang === 'fr' ? 'Unique' : 'Unique'}
                    </span>
                  </div>
                  <span className="font-display text-[16px] font-light text-white/90">{piece.price}<span className="text-[10px] text-white/50 ml-0.5">CAD</span></span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Engagement marque */}
        <p className="text-label text-[8px] text-[#7a7a8a] tracking-[1px] text-center leading-relaxed pt-1">
          {t.engagement}
        </p>
      </div>

      {/* ── Total ── */}
      <div className="relative bg-[#043672] overflow-hidden p-6 flex items-center justify-between" data-theme="dark">
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[radial-gradient(circle,rgba(184,150,90,0.12)_0%,transparent_70%)] pointer-events-none" />
        <div className="flex flex-col gap-1 relative">
          <span className="text-label text-[8px] text-white/40 tracking-[4px]">{t.total}</span>
          <span className="text-label text-[8px] text-[#d4aa6a] tracking-[2px]">
            {selections.length} {lang === 'fr' ? (selections.length > 1 ? 'pièces' : 'pièce') : (selections.length > 1 ? 'pieces' : 'piece')}
          </span>
        </div>
        <span className="font-display text-[38px] font-light text-white relative leading-none">
          {data.priceTotal}<span className="text-[16px] text-white/50 ml-1">CAD</span>
        </span>
      </div>

      {/* ── Livraison ── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="w-1 h-3 bg-[#b8965a]/60 flex-shrink-0" />
          <span className="text-label text-[8px] text-[#043672] tracking-[5px]">{t.delivery}</span>
          <span className="flex-1 h-px bg-[#043672]/06" />
          <button onClick={() => onEdit(1)} data-cursor="hover"
            className="text-label text-[8px] text-[#7a7a8a] hover:text-[#b8965a] tracking-[2px] transition-colors cursor-none">
            {editLabel(lang)}
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-3">
          <span className="text-label text-[8px] text-[#b8965a] tracking-[4px]">{t.recipient}</span>
          <div className="flex flex-col gap-1.5">
            <span className="text-[14px] text-[#043672] font-light">{data.firstName} {data.lastName}</span>
            <span className="text-[12px] text-[#7a7a8a] font-light">{data.email}</span>
            {data.phone && <span className="text-[12px] text-[#7a7a8a] font-light">{data.phone}</span>}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <span className="text-label text-[8px] text-[#b8965a] tracking-[4px]">{lang === 'fr' ? 'Adresse' : 'Address'}</span>
          <div className="flex flex-col gap-0.5 text-[12px] text-[#7a7a8a] font-light leading-relaxed">
            <span className="text-[#043672] text-[13px]">{data.address}</span>
            <span>{data.city}{data.province ? `, ${data.province}` : ''} {data.postalCode}</span>
            <span className="text-[#043672]">{countryLabel}</span>
          </div>
        </div>
        </div>
      </div>

      {/* ── Paiement (adapté au pays) ── */}
      <div className="bg-[#b8965a]/06 border border-[#b8965a]/20 p-5 flex gap-4">
        <span className="text-[#b8965a] text-lg flex-shrink-0 mt-0.5">✦</span>
        <div>
          <p className="text-label text-[9px] text-[#043672] tracking-[3px] mb-1.5">
            {payMethod === 'interac'
              ? (lang === 'fr' ? 'Paiement par virement Interac' : 'Payment by Interac transfer')
              : (lang === 'fr' ? 'Paiement par virement bancaire' : 'Payment by bank transfer')}
          </p>
          <p className="text-[12px] text-[#7a7a8a] font-light leading-relaxed">{t.paymentDesc}</p>
        </div>
      </div>

      {/* ── Vente finale ── */}
      <p className="text-label text-[8px] text-[#7a7a8a] tracking-[1px] text-center leading-relaxed flex items-center justify-center gap-1.5">
        <span className="text-[7px] text-[#b8965a]">✦</span>{t.finalSale}
      </p>

      {/* ── Navigation ── */}
      <div className="flex items-center justify-between pt-2 border-t border-[#043672]/08">
        <button onClick={onBack} disabled={loading} data-cursor="hover"
          className="text-label text-[9px] text-[#7a7a8a] tracking-[3px] hover:text-[#043672] transition-colors flex items-center gap-2 cursor-none disabled:opacity-40">
          ← {t.back}
        </button>
        <button onClick={onSubmit} disabled={loading} data-cursor="hover"
          className="group relative inline-flex items-center gap-4 bg-[#043672] text-white overflow-hidden px-8 py-4 cursor-none disabled:opacity-60">
          <span className="absolute inset-0 bg-[#0a4d9e] -translate-x-full group-hover:translate-x-0 transition-transform duration-[420ms] ease-[cubic-bezier(.16,1,.3,1)] group-disabled:hidden" />
          <span className="relative text-label text-[9px] tracking-[3px]">{loading ? t.loading : t.confirm}</span>
          {!loading && <span className="relative text-sm group-hover:translate-x-1.5 transition-transform duration-300">→</span>}
        </button>
      </div>
    </motion.div>
  )
}
