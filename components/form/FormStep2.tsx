'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { orderSchema, type OrderFormData } from '@/lib/schemas'
import AddressAutocomplete from './AddressAutocomplete'

const ease = [0.16, 1, 0.3, 1] as const

const provinces = ['AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT']

const copy = {
  fr: {
    title: 'Vos informations', sub: 'Canada uniquement. Vos données restent confidentielles.',
    firstName: 'Prénom', lastName: 'Nom', email: 'Courriel', phone: 'Téléphone (optionnel)',
    address: 'Adresse', city: 'Ville', province: 'Province', postalCode: 'Code postal',
    whyLocht: 'Qu\'est-ce qui vous a attiré ? (optionnel)', whyPlaceholder: 'Une matière, une histoire, une rencontre...',
    back: 'Retour', next: 'Continuer',
  },
  en: {
    title: 'Your information', sub: 'Canada only. Your data remains confidential.',
    firstName: 'First name', lastName: 'Last name', email: 'Email', phone: 'Phone (optional)',
    address: 'Address', city: 'City', province: 'Province', postalCode: 'Postal code',
    whyLocht: 'What drew you to Maison Locht? (optional)', whyPlaceholder: 'A material, a story, an encounter...',
    back: 'Back', next: 'Continue',
  },
}

type Props = {
  data: Partial<OrderFormData>
  lang: 'fr' | 'en'
  onChange: (d: Partial<OrderFormData>) => void
  onNext: () => void
  onBack: () => void
}

const inputClass = "w-full bg-transparent border border-[#043672]/20 focus:border-[#b8965a] outline-none px-4 py-3 text-[13px] text-[#1a1a2e] placeholder:text-[#7a7a8a]/60 transition-colors duration-200 font-light"
const labelClass = "text-label text-[8px] text-[#b8965a] tracking-[3px] block mb-1.5"

export default function FormStep2({ data, lang, onChange, onNext, onBack }: Props) {
  const t = copy[lang]
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (field: keyof OrderFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    onChange({ [field]: e.target.value })

  // Formate le code postal canadien : A1A 1A1
  const formatPostal = (raw: string) => {
    const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    return clean.length > 3 ? `${clean.slice(0, 3)} ${clean.slice(3)}` : clean
  }
  const setPostal = (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ postalCode: formatPostal(e.target.value) })

  const validate = () => {
    const partial = orderSchema.pick({
      firstName: true, lastName: true, email: true,
      address: true, city: true, province: true, postalCode: true,
    }).safeParse(data)

    if (!partial.success) {
      const errs: Record<string, string> = {}
      partial.error.issues.forEach(e => {
        const key = e.path[0]
        if (key != null) errs[String(key)] = e.message
      })
      setErrors(errs)
      return false
    }
    setErrors({})
    return true
  }

  const handleNext = () => { if (validate()) onNext() }

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

      <div className="flex flex-col gap-5">
        {/* Nom */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label htmlFor="firstName" className={labelClass}>{t.firstName} *</label>
            <input id="firstName" type="text" placeholder="Marie" autoComplete="given-name"
              value={data.firstName ?? ''} onChange={set('firstName')}
              className={`${inputClass} ${errors.firstName ? 'border-red-400' : ''}`} />
            {errors.firstName && <span className="text-[10px] text-red-400 mt-1">{errors.firstName}</span>}
          </div>
          <div className="flex flex-col">
            <label htmlFor="lastName" className={labelClass}>{t.lastName} *</label>
            <input id="lastName" type="text" placeholder="Dupont" autoComplete="family-name"
              value={data.lastName ?? ''} onChange={set('lastName')}
              className={`${inputClass} ${errors.lastName ? 'border-red-400' : ''}`} />
            {errors.lastName && <span className="text-[10px] text-red-400 mt-1">{errors.lastName}</span>}
          </div>
        </div>

        {/* Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label htmlFor="email" className={labelClass}>{t.email} *</label>
            <input id="email" type="email" placeholder="marie@exemple.com" autoComplete="email"
              value={data.email ?? ''} onChange={set('email')}
              className={`${inputClass} ${errors.email ? 'border-red-400' : ''}`} />
            {errors.email && <span className="text-[10px] text-red-400 mt-1">{errors.email}</span>}
          </div>
          <div className="flex flex-col">
            <label htmlFor="phone" className={labelClass}>{t.phone}</label>
            <input id="phone" type="tel" placeholder="+1 514 000 0000" autoComplete="tel"
              value={data.phone ?? ''} onChange={set('phone')} className={inputClass} />
          </div>
        </div>

        {/* Adresse — autocomplete Canada */}
        <div className="flex flex-col">
          <label className={labelClass}>{t.address} *</label>
          <AddressAutocomplete
            value={data.address ?? ''}
            placeholder="123 Rue Principale, Montréal"
            inputClass={inputClass}
            hasError={!!errors.address}
            lang={lang}
            province={data.province}
            city={data.city}
            onChange={(v) => onChange({ address: v })}
            onSelect={(r) => onChange({
              address:    r.address    || data.address,
              city:       r.city       || data.city,
              province:   r.province   || data.province,
              postalCode: r.postalCode  || data.postalCode,
            })}
          />
          {errors.address && <span className="text-[10px] text-red-400 mt-1">{errors.address}</span>}
          <span className="text-label text-[7px] text-[#7a7a8a] tracking-[1px] mt-1">
            {lang === 'fr' ? 'Commencez à taper pour voir des suggestions canadiennes' : 'Start typing to see Canadian address suggestions'}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="flex flex-col">
            <label htmlFor="city" className={labelClass}>{t.city} *</label>
            <input id="city" type="text" placeholder="Montréal" autoComplete="address-level2"
              value={data.city ?? ''} onChange={set('city')}
              className={`${inputClass} ${errors.city ? 'border-red-400' : ''}`} />
            {errors.city && <span className="text-[10px] text-red-400 mt-1">{errors.city}</span>}
          </div>

          {/* Province */}
          <div className="flex flex-col">
            <label htmlFor="province" className={labelClass}>{t.province} *</label>
            <select id="province" autoComplete="address-level1"
              value={data.province ?? ''} onChange={set('province')}
              className={`${inputClass} ${errors.province ? 'border-red-400' : ''}`}>
              <option value="">—</option>
              {provinces.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {errors.province && <span className="text-[10px] text-red-400 mt-1">{errors.province}</span>}
          </div>

          {/* Code postal — formatage automatique */}
          <div className="flex flex-col">
            <label htmlFor="postalCode" className={labelClass}>{t.postalCode} *</label>
            <input id="postalCode" type="text" placeholder="H1A 1A1" autoComplete="postal-code"
              maxLength={7} value={data.postalCode ?? ''} onChange={setPostal}
              className={`${inputClass} ${errors.postalCode ? 'border-red-400' : ''}`} />
            {errors.postalCode && <span className="text-[10px] text-red-400 mt-1">{errors.postalCode}</span>}
          </div>
        </div>

        {/* Pourquoi Maison Locht */}
        <div className="flex flex-col">
          <label htmlFor="whyLocht" className={labelClass}>{t.whyLocht}</label>
          <textarea
            id="whyLocht"
            placeholder={t.whyPlaceholder}
            value={data.whyLocht ?? ''}
            onChange={set('whyLocht')}
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2 border-t border-[#043672]/08">
        <button
          onClick={onBack}
          className="text-label text-[9px] text-[#7a7a8a] tracking-[3px] hover:text-[#043672] transition-colors duration-200 flex items-center gap-2 cursor-none"
          data-cursor="hover"
        >
          ← {t.back}
        </button>
        <button
          onClick={handleNext}
          className="group relative inline-flex items-center gap-4 bg-[#043672] text-white overflow-hidden px-8 py-4 cursor-none"
          data-cursor="hover"
        >
          <span className="absolute inset-0 bg-[#0a4d9e] -translate-x-full group-hover:translate-x-0 transition-transform duration-[420ms] ease-[cubic-bezier(.16,1,.3,1)]" />
          <span className="relative text-label text-[9px] tracking-[3px]">{t.next}</span>
          <span className="relative text-sm group-hover:translate-x-1.5 transition-transform duration-300">→</span>
        </button>
      </div>
    </motion.div>
  )
}
