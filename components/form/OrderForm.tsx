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
    successEyebrow: 'Commande confirmée',
    successTitle: 'Merci.',
    successSub: 'Votre pièce vous attend. Conservez votre référence — elle vous suit jusqu\'à la livraison.',
    refLabel: 'Votre référence',
    copied: 'Copié',
    copy: 'Copier',
    nextTitle: 'Les prochaines étapes',
    nextSteps: [
      { n: '01', label: 'Courriel envoyé', desc: 'Les instructions de virement Interac sont dans votre boîte mail.' },
      { n: '02', label: 'Virement Interac', desc: 'Effectuez le paiement à Ml@maisonlocht.com avec votre référence en message.' },
      { n: '03', label: 'Confirmation', desc: 'Dès réception, votre commande est confirmée et préparée à la main.' },
    ],
    trackCta: 'Suivre ma commande',
    newOrder: 'Nouvelle commande',
  },
  en: {
    eyebrow: 'Pre-sale', title: 'Order',
    steps: ['Selection', 'Information', 'Confirmation'],
    successEyebrow: 'Order confirmed',
    successTitle: 'Thank you.',
    successSub: 'Your piece awaits. Keep your reference — it follows you all the way to delivery.',
    refLabel: 'Your reference',
    copied: 'Copied',
    copy: 'Copy',
    nextTitle: 'Next steps',
    nextSteps: [
      { n: '01', label: 'Email sent', desc: 'Interac transfer instructions are in your inbox.' },
      { n: '02', label: 'Interac transfer', desc: 'Send payment to Ml@maisonlocht.com with your reference as the message.' },
      { n: '03', label: 'Confirmation', desc: 'Upon receipt, your order is confirmed and hand-prepared.' },
    ],
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
  const [copied, setCopied]         = useState(false)

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
        body: JSON.stringify({ ...data, pieces: selections, lang }),
      })
      const json = await res.json()

      // Pièce prise par quelqu'un d'autre pendant la commande
      if (res.status === 409 && json.error === 'piece_unavailable') {
        const label = `${json.modelName} N°${String(json.pieceNum).padStart(2, '0')}`
        // Retirer la pièce indisponible de la sélection
        setSelections(prev => prev.filter(p => p.id !== json.pieceId))
        setError(lang === 'fr'
          ? `${label} vient d'être réservée par une autre personne. Elle a été retirée de votre sélection — choisissez-en une autre.`
          : `${label} was just reserved by someone else. It has been removed from your selection — please choose another.`)
        setStep(0)
        setLoading(false)
        return
      }

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
        className="flex flex-col items-center gap-10 py-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease }}
      >
        {/* En-tête cérémonial */}
        <motion.div
          className="flex flex-col items-center text-center gap-4"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease }}
        >
          {/* Sceau animé */}
          <motion.div
            className="relative w-16 h-16 flex items-center justify-center"
            initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <span className="absolute inset-0 rounded-full border border-[#b8965a]/40" />
            <span className="absolute inset-2 rounded-full border border-[#b8965a]/20" />
            <span className="text-[#b8965a] text-xl">✦</span>
          </motion.div>

          <span className="text-label text-[9px] text-[#b8965a] tracking-[5px]">{t.successEyebrow}</span>
          <h3 className="font-display text-[44px] md:text-[52px] font-light italic text-[#043672] leading-none">{t.successTitle}</h3>
          <p className="text-[13px] text-[#7a7a8a] font-light max-w-[420px] leading-relaxed">{t.successSub}</p>
        </motion.div>

        {/* Bloc référence — copiable */}
        <motion.div
          className="relative w-full max-w-[400px]"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease }}
        >
          <div
            className="relative bg-[#043672] overflow-hidden px-8 py-7 text-center"
            data-theme="dark"
            style={{ animation: 'badge-glow 3s ease-in-out infinite' }}
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[radial-gradient(circle,rgba(184,150,90,0.15)_0%,transparent_70%)] pointer-events-none" />
            <span className="text-label text-[8px] text-white/40 tracking-[4px] block mb-3 relative">{t.refLabel}</span>
            <span
              className="font-display text-[34px] md:text-[38px] font-light text-white tracking-[4px] block relative"
              style={{
                background: 'linear-gradient(90deg,#fff 30%,#d4aa6a 50%,#fff 70%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text', animation: 'shimmer-sweep 2.5s ease-in-out 1',
              }}
            >
              {reference}
            </span>
            {/* Bouton copier */}
            <button
              onClick={() => { navigator.clipboard.writeText(reference); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
              className="mt-4 text-label text-[8px] text-[#d4aa6a] tracking-[3px] border border-[#b8965a]/30 hover:border-[#b8965a] px-4 py-2 transition-colors duration-200 cursor-none relative inline-flex items-center gap-2"
              data-cursor="hover"
            >
              {copied ? `✓ ${t.copied}` : t.copy}
            </button>
          </div>
        </motion.div>

        {/* Prochaines étapes */}
        <motion.div
          className="w-full max-w-[460px] flex flex-col gap-4"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55, ease }}
        >
          <div className="flex items-center gap-3">
            <span className="w-1 h-3 bg-[#b8965a]/60" />
            <span className="text-label text-[8px] text-[#043672] tracking-[5px]">{t.nextTitle}</span>
            <span className="flex-1 h-px bg-[#043672]/06" />
          </div>
          {t.nextSteps.map((s, i) => (
            <motion.div
              key={s.n}
              className="flex gap-4 items-start"
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.65 + i * 0.12, ease }}
            >
              <span className="font-display text-[18px] font-light text-[#b8965a] leading-none pt-0.5 flex-shrink-0">{s.n}</span>
              <div className="flex flex-col gap-0.5">
                <span className="text-label text-[8px] text-[#043672] tracking-[2px]">{s.label}</span>
                <span className="text-[12px] text-[#7a7a8a] font-light leading-relaxed">{s.desc}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Actions */}
        <motion.div
          className="flex flex-col sm:flex-row items-center gap-4 pt-2"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
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
        </motion.div>
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
