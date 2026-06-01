'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { orderSchema, type OrderFormData } from '@/lib/schemas'
import { COUNTRIES, getPostalFormat, formatPostalCode } from '@/lib/countries'
import AddressAutocomplete from './AddressAutocomplete'

const ease = [0.16, 1, 0.3, 1] as const

const CA_PROVINCES = ['AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT']

const copy = {
  fr: {
    title: 'Vos informations',
    sub: 'Vos données sont confidentielles et utilisées uniquement pour la livraison.',
    sectionIdentity: 'Identité',
    sectionContact: 'Contact',
    sectionDelivery: 'Adresse de livraison',
    firstName: 'Prénom', lastName: 'Nom',
    email: 'Courriel', phone: 'Téléphone (optionnel)',
    country: 'Pays',
    address: 'Adresse', city: 'Ville',
    province: 'Province', state: 'État / Région',
    whyLocht: 'Qu\'est-ce qui vous a attiré ? (optionnel)',
    whyPlaceholder: 'Une matière, une histoire, une rencontre...',
    back: 'Retour', next: 'Continuer',
    selectCountry: '— Sélectionner —',
    selectProvince: '— Province —',
    addressHint: 'Commencez à taper pour voir les suggestions',
  },
  en: {
    title: 'Your information',
    sub: 'Your data is confidential and used only for delivery.',
    sectionIdentity: 'Identity',
    sectionContact: 'Contact',
    sectionDelivery: 'Delivery address',
    firstName: 'First name', lastName: 'Last name',
    email: 'Email', phone: 'Phone (optional)',
    country: 'Country',
    address: 'Address', city: 'City',
    province: 'Province', state: 'State / Region',
    whyLocht: 'What drew you to Maison Locht? (optional)',
    whyPlaceholder: 'A material, a story, an encounter...',
    back: 'Back', next: 'Continue',
    selectCountry: '— Select —',
    selectProvince: '— Province —',
    addressHint: 'Start typing to see suggestions',
  },
}

type Props = {
  data: Partial<OrderFormData>
  lang: 'fr' | 'en'
  onChange: (d: Partial<OrderFormData>) => void
  onNext: () => void
  onBack: () => void
}

const inputClass = "w-full bg-transparent border border-[#043672]/20 focus:border-[#b8965a] outline-none px-4 py-3 text-[13px] text-[#1a1a2e] placeholder:text-[#7a7a8a]/50 transition-colors duration-200 font-light"
const labelClass = "text-label text-[8px] text-[#b8965a] tracking-[3px] block mb-1.5"
const errorClass = "text-[10px] text-red-400 mt-1"

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 pb-2 border-b border-[#043672]/08">
      <span className="text-label text-[8px] text-[#043672] tracking-[4px]">{label}</span>
      <span className="flex-1 h-px bg-[#043672]/06" />
    </div>
  )
}

export default function FormStep2({ data, lang, onChange, onNext, onBack }: Props) {
  const t = copy[lang]
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (field: keyof OrderFormData, value: string) => onChange({ [field]: value })

  const postalFormat = getPostalFormat(data.country ?? 'CA')
  const isCanada = data.country === 'CA'
  const countryInfo = COUNTRIES.find(c => c.code === data.country)

  const handlePostal = (e: React.ChangeEvent<HTMLInputElement>) => {
    set('postalCode', formatPostalCode(e.target.value, data.country ?? 'CA'))
  }

  const handleCountryChange = (code: string) => {
    onChange({ country: code, province: '', postalCode: '' })
  }

  const validate = () => {
    const result = orderSchema.pick({
      firstName: true, lastName: true, email: true,
      country: true, address: true, city: true, postalCode: true,
    }).safeParse(data)

    if (!result.success) {
      const errs: Record<string, string> = {}
      result.error.issues.forEach(e => {
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

      <div className="flex flex-col gap-6">

        {/* ── Identité ── */}
        <SectionHeader label={t.sectionIdentity} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className={labelClass}>{t.firstName} *</label>
            <input type="text" placeholder="Marie" autoComplete="given-name"
              value={data.firstName ?? ''} onChange={e => set('firstName', e.target.value)}
              className={`${inputClass} ${errors.firstName ? 'border-red-400' : ''}`} />
            {errors.firstName && <span className={errorClass}>{errors.firstName}</span>}
          </div>
          <div className="flex flex-col">
            <label className={labelClass}>{t.lastName} *</label>
            <input type="text" placeholder="Dupont" autoComplete="family-name"
              value={data.lastName ?? ''} onChange={e => set('lastName', e.target.value)}
              className={`${inputClass} ${errors.lastName ? 'border-red-400' : ''}`} />
            {errors.lastName && <span className={errorClass}>{errors.lastName}</span>}
          </div>
        </div>

        {/* ── Contact ── */}
        <SectionHeader label={t.sectionContact} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className={labelClass}>{t.email} *</label>
            <input type="email" placeholder="marie@exemple.com" autoComplete="email"
              value={data.email ?? ''} onChange={e => set('email', e.target.value)}
              className={`${inputClass} ${errors.email ? 'border-red-400' : ''}`} />
            {errors.email && <span className={errorClass}>{errors.email}</span>}
          </div>
          <div className="flex flex-col">
            <label className={labelClass}>{t.phone}</label>
            <input type="tel" placeholder="+1 514 000 0000" autoComplete="tel"
              value={data.phone ?? ''} onChange={e => set('phone', e.target.value)}
              className={inputClass} />
          </div>
        </div>

        {/* ── Adresse ── */}
        <SectionHeader label={t.sectionDelivery} />

        {/* Pays — en premier */}
        <div className="flex flex-col">
          <label className={labelClass}>{t.country} *</label>
          <select
            value={data.country ?? ''}
            onChange={e => handleCountryChange(e.target.value)}
            className={`${inputClass} ${errors.country ? 'border-red-400' : ''}`}
          >
            <option value="">{t.selectCountry}</option>
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>
                {lang === 'fr' ? c.name : c.nameEn}
              </option>
            ))}
          </select>
          {errors.country && <span className={errorClass}>{errors.country}</span>}
        </div>

        {/* Adresse — autocomplete si pays sélectionné */}
        {data.country && (
          <>
            <div className="flex flex-col">
              <label className={labelClass}>{t.address} *</label>
              <AddressAutocomplete
                value={data.address ?? ''}
                placeholder={isCanada ? '123 Rue Principale' : '123 Main Street'}
                inputClass={inputClass}
                hasError={!!errors.address}
                lang={lang}
                country={data.country}
                province={data.province}
                city={data.city}
                onChange={v => set('address', v)}
                onSelect={r => onChange({
                  address:    r.address    || data.address,
                  city:       r.city       || data.city,
                  province:   r.province   || data.province,
                  postalCode: r.postalCode  || data.postalCode,
                })}
              />
              {errors.address && <span className={errorClass}>{errors.address}</span>}
              <span className="text-label text-[7px] text-[#7a7a8a] tracking-[1px] mt-1">{t.addressHint}</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Ville */}
              <div className="flex flex-col">
                <label className={labelClass}>{t.city} *</label>
                <input type="text" autoComplete="address-level2"
                  value={data.city ?? ''} onChange={e => set('city', e.target.value)}
                  className={`${inputClass} ${errors.city ? 'border-red-400' : ''}`} />
                {errors.city && <span className={errorClass}>{errors.city}</span>}
              </div>

              {/* Province/État */}
              <div className="flex flex-col">
                <label className={labelClass}>{isCanada ? t.province : t.state}</label>
                {isCanada ? (
                  <select
                    value={data.province ?? ''}
                    onChange={e => set('province', e.target.value)}
                    className={inputClass}
                    autoComplete="address-level1"
                  >
                    <option value="">{t.selectProvince}</option>
                    {CA_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                ) : (
                  <input type="text" autoComplete="address-level1"
                    value={data.province ?? ''} onChange={e => set('province', e.target.value)}
                    className={inputClass} />
                )}
              </div>

              {/* Code postal — format dynamique */}
              <div className="flex flex-col">
                <label className={labelClass}>
                  {lang === 'fr' ? postalFormat.label.fr : postalFormat.label.en} *
                </label>
                <input
                  type="text"
                  placeholder={postalFormat.placeholder}
                  autoComplete="postal-code"
                  maxLength={isCanada ? 7 : 12}
                  value={data.postalCode ?? ''}
                  onChange={handlePostal}
                  className={`${inputClass} ${errors.postalCode ? 'border-red-400' : ''}`}
                />
                {errors.postalCode && <span className={errorClass}>{errors.postalCode}</span>}
                {postalFormat.hint && (
                  <span className="text-label text-[7px] text-[#7a7a8a] tracking-[1px] mt-1">
                    {lang === 'fr' ? postalFormat.hint.fr : postalFormat.hint.en}
                  </span>
                )}
              </div>
            </div>
          </>
        )}

        {/* Pourquoi Maison Locht */}
        <div className="flex flex-col">
          <label className={labelClass}>{t.whyLocht}</label>
          <textarea
            placeholder={t.whyPlaceholder}
            value={data.whyLocht ?? ''}
            onChange={e => set('whyLocht', e.target.value)}
            rows={2}
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2 border-t border-[#043672]/08">
        <button onClick={onBack} className="text-label text-[9px] text-[#7a7a8a] tracking-[3px] hover:text-[#043672] transition-colors flex items-center gap-2 cursor-none" data-cursor="hover">
          ← {t.back}
        </button>
        <button onClick={handleNext} className="group relative inline-flex items-center gap-4 bg-[#043672] text-white overflow-hidden px-8 py-4 cursor-none" data-cursor="hover">
          <span className="absolute inset-0 bg-[#0a4d9e] -translate-x-full group-hover:translate-x-0 transition-transform duration-[420ms] ease-[cubic-bezier(.16,1,.3,1)]" />
          <span className="relative text-label text-[9px] tracking-[3px]">{t.next}</span>
          <span className="relative text-sm group-hover:translate-x-1.5 transition-transform duration-300">→</span>
        </button>
      </div>
    </motion.div>
  )
}
