'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from '@/components/landing/LangContext'
import FormStep1, { type SelectedPiece } from './FormStep1'
import FormStep2 from './FormStep2'
import FormStep3 from './FormStep3'
import type { OrderFormData } from '@/lib/schemas'

const ease = [0.16, 1, 0.3, 1] as const

const copy = {
  fr: {
    eyebrow: 'Pré-vente', title: 'Commander',
    steps: ['Sélection', 'Informations', 'Confirmation'],
    successTitle: 'Commande reçue',
    successSub: 'Vérifiez votre boîte mail — les instructions de paiement vous ont été envoyées.',
    refLabel: 'Votre référence',
    trackCta: 'Suivre ma commande',
    newOrder: 'Nouvelle commande',
  },
  en: {
    eyebrow: 'Pre-sale', title: 'Order',
    steps: ['Selection', 'Information', 'Confirmation'],
    successTitle: 'Order received',
    successSub: 'Check your inbox — payment instructions have been sent to you.',
    refLabel: 'Your reference',
    trackCta: 'Track my order',
    newOrder: 'New order',
  },
}

export default function OrderForm() {
  const { lang } = useLang()
  const t = copy[lang]

  const [step, setStep]             = useState(0)
  const [data, setData]             = useState<Partial<OrderFormData>>({ lang, quantity: 1 })
  const [selections, setSelections] = useState<SelectedPiece[]>([])
  const [loading, setLoading]       = useState(false)
  const [reference, setReference]   = useState<string | null>(null)
  const [error, setError]           = useState<string | null>(null)

  const update = (d: Partial<OrderFormData>) => setData(prev => ({ ...prev, ...d }))

  // Écoute la pré-sélection depuis la Collection
  useEffect(() => {
    const handler = (e: Event) => {
      const piece = (e as CustomEvent).detail as SelectedPiece
      if (!piece) return
      setSelections(prev => {
        if (prev.some(p => p.id === piece.id)) return prev
        const next = prev.length >= 2 ? [piece] : [...prev, piece]
        const total = next.reduce((s, p) => s + p.price, 0)
        const names = next.map(p => `${p.modelName} N°${String(p.pieceNum).padStart(2, '0')}`).join(' · ')
        update({ bagModel: next[0].model, bagName: names, quantity: next.length as 1 | 2, priceTotal: total })
        return next
      })
      setStep(0) // S'assure qu'on est sur l'étape 1
    }
    window.addEventListener('preselect-bag', handler)
    return () => window.removeEventListener('preselect-bag', handler)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, lang }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur')
      setReference(json.reference)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inattendue')
    } finally {
      setLoading(false)
    }
  }

  // ── Succès ────────────────────────────────────────────────
  if (reference) {
    return (
      <motion.div
        className="text-center flex flex-col items-center gap-6 py-8"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease }}
      >
        <span className="text-[#b8965a] text-2xl">✦</span>
        <div>
          <h3 className="font-display text-[32px] font-light text-[#043672] mb-2">{t.successTitle}</h3>
          <p className="text-[13px] text-[#7a7a8a] font-light max-w-[400px] mx-auto leading-relaxed">{t.successSub}</p>
        </div>

        <div className="bg-[#043672] px-10 py-6 text-center" style={{ animation: 'badge-glow 2.8s ease-in-out infinite' }}>
          <span className="text-label text-[8px] text-white/40 tracking-[3px] block mb-2">{t.refLabel}</span>
          <span className="font-display text-[32px] font-light text-white tracking-[4px]">{reference}</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <a
            href={`/commande/${reference}`}
            className="group relative inline-flex items-center justify-center gap-3 bg-[#043672] text-white overflow-hidden px-8 py-4 cursor-none"
            data-cursor="hover"
          >
            <span className="absolute inset-0 bg-[#0a4d9e] -translate-x-full group-hover:translate-x-0 transition-transform duration-[420ms] ease-[cubic-bezier(.16,1,.3,1)]" />
            <span className="relative text-label text-[9px] tracking-[3px]">{t.trackCta}</span>
            <span className="relative text-sm group-hover:translate-x-1.5 transition-transform duration-300">→</span>
          </a>
          <button
            onClick={() => { setReference(null); setStep(0); setData({ lang, quantity: 1 }); setSelections([]) }}
            className="text-label text-[9px] text-[#7a7a8a] tracking-[3px] hover:text-[#043672] transition-colors duration-200 px-4 cursor-none"
            data-cursor="hover"
          >
            {t.newOrder}
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {/* En-tête */}
      <div className="flex flex-col gap-1">
        <span className="text-label text-[9px] text-[#b8965a] tracking-[5px]">{t.eyebrow}</span>
        <h2 className="font-display text-[36px] md:text-[44px] font-light text-[#043672]">{t.title}</h2>
      </div>

      {/* Indicateur de progression */}
      <div className="flex items-center gap-0">
        {t.steps.map((label, i) => (
          <div key={i} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 flex items-center justify-center text-[10px] transition-all duration-300 ${
                i < step ? 'bg-[#b8965a] text-white' :
                i === step ? 'bg-[#043672] text-white' :
                'border border-[#043672]/20 text-[#7a7a8a]'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-label text-[8px] tracking-[2px] transition-colors duration-300 hidden sm:block ${i === step ? 'text-[#043672]' : 'text-[#7a7a8a]'}`}>
                {label}
              </span>
            </div>
            {i < t.steps.length - 1 && (
              <div className={`w-8 md:w-12 h-px mx-2 transition-colors duration-500 ${i < step ? 'bg-[#b8965a]' : 'bg-[#043672]/15'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 px-4 py-3 text-[12px] text-red-600">{error}</div>
      )}

      {/* Étapes */}
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.35, ease }}>
          {step === 0 && <FormStep1 data={data} selections={selections} lang={lang} onChange={update} onSelectionsChange={setSelections} onNext={() => setStep(1)} />}
          {step === 1 && <FormStep2 data={data} lang={lang} onChange={update} onNext={() => setStep(2)} onBack={() => setStep(0)} />}
          {step === 2 && <FormStep3 data={data} selections={selections} lang={lang} loading={loading} onBack={() => setStep(1)} onSubmit={submit} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
