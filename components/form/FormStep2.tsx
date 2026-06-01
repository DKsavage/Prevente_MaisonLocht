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
    sub: 'Vos données sont utilisées uniquement pour la livraison.',
    id: 'Identité', contact: 'Contact', delivery: 'Livraison',
    firstName: 'Prénom', lastName: 'Nom',
    email: 'Courriel', phone: 'Téléphone',
    country: 'Pays de livraison',
    address: 'Adresse', city: 'Ville',
    province: 'Province', region: 'État / Région',
    postal: (c: string) => getPostalFormat(c).label.fr,
    why: "Qu'est-ce qui vous a attiré ?",
    whyPlaceholder: 'Une matière, une histoire, une rencontre… (optionnel)',
    back: 'Retour', next: 'Continuer',
    selectCountry: 'Sélectionner un pays',
    selectProvince: 'Province',
    optional: 'optionnel',
  },
  en: {
    title: 'Your information',
    sub: 'Your data is used only for delivery.',
    id: 'Identity', contact: 'Contact', delivery: 'Delivery',
    firstName: 'First name', lastName: 'Last name',
    email: 'Email', phone: 'Phone',
    country: 'Delivery country',
    address: 'Address', city: 'City',
    province: 'Province', region: 'State / Region',
    postal: (c: string) => getPostalFormat(c).label.en,
    why: 'What drew you to Maison Locht?',
    whyPlaceholder: 'A material, a story, an encounter… (optional)',
    back: 'Back', next: 'Continue',
    selectCountry: 'Select a country',
    selectProvince: 'Province',
    optional: 'optional',
  },
}

type Props = {
  data: Partial<OrderFormData>
  lang: 'fr' | 'en'
  onChange: (d: Partial<OrderFormData>) => void
  onNext: () => void
  onBack: () => void
}

// Styles de base
const base = "w-full bg-transparent border-b border-[#043672]/20 focus:border-[#b8965a] outline-none px-0 py-3 text-[13px] text-[#1a1a2e] placeholder:text-[#7a7a8a]/40 transition-colors duration-200 font-light"
const baseBox = "w-full bg-[#faf7f2] border border-[#043672]/15 focus:border-[#b8965a] outline-none px-4 py-3 text-[13px] text-[#1a1a2e] placeholder:text-[#7a7a8a]/40 transition-all duration-200 font-light focus:shadow-[0_0_0_3px_rgba(184,150,90,0.08)]"
const labelBase = "text-label text-[8px] text-[#b8965a] tracking-[3px] block mb-2"
const errBase = "text-[10px] text-red-400 mt-1.5 flex items-center gap-1"

function Field({ label, error, optional, lang, children }: {
  label: string; error?: string; optional?: boolean; lang: 'fr' | 'en'; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col">
      <label className={labelBase}>
        {label}
        {optional && <span className="ml-1 text-[#7a7a8a]/60 normal-case tracking-normal" style={{ fontFamily: 'var(--font-dm-sans)' }}> — {lang === 'fr' ? 'optionnel' : 'optional'}</span>}
      </label>
      {children}
      {error && <span className={errBase}><span className="text-[8px]">⚠</span>{error}</span>}
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3 mb-1">
        <span className="w-1 h-3 bg-[#b8965a]/60 flex-shrink-0" />
        <span className="text-label text-[8px] text-[#043672] tracking-[5px]">{label}</span>
        <span className="flex-1 h-px bg-[#043672]/06" />
      </div>
      {children}
    </div>
  )
}

export default function FormStep2({ data, lang, onChange, onNext, onBack }: Props) {
  const t = copy[lang]
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (field: keyof OrderFormData, value: string) => onChange({ [field]: value })

  const isCanada    = data.country === 'CA'
  const postalFmt   = getPostalFormat(data.country ?? 'CA')
  const postalHint  = postalFmt.hint ? (lang === 'fr' ? postalFmt.hint.fr : postalFmt.hint.en) : ''

  const handleCountry = (code: string) => onChange({ country: code, province: '', postalCode: '' })
  const handlePostal  = (e: React.ChangeEvent<HTMLInputElement>) =>
    set('postalCode', formatPostalCode(e.target.value, data.country ?? ''))

  const validate = () => {
    const result = orderSchema.pick({
      firstName: true, lastName: true, email: true,
      country: true, address: true, city: true, postalCode: true,
    }).safeParse(data)
    if (!result.success) {
      const errs: Record<string, string> = {}
      result.error.issues.forEach(e => {
        const k = e.path[0]; if (k != null) errs[String(k)] = e.message
      })
      setErrors(errs)
      return false
    }
    setErrors({})
    return true
  }

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

      {/* Honeypot anti-bot — invisible pour les humains, rempli par les bots */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={data.website ?? ''}
        onChange={e => set('website', e.target.value)}
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
      />

      {/* ── Identité ── */}
      <Section label={t.id}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label={t.firstName} error={errors.firstName} lang={lang}>
            <input type="text" autoComplete="given-name" placeholder="Marie"
              value={data.firstName ?? ''} onChange={e => set('firstName', e.target.value)}
              className={`${base} ${errors.firstName ? 'border-red-400' : ''}`} />
          </Field>
          <Field label={t.lastName} error={errors.lastName} lang={lang}>
            <input type="text" autoComplete="family-name" placeholder="Dupont"
              value={data.lastName ?? ''} onChange={e => set('lastName', e.target.value)}
              className={`${base} ${errors.lastName ? 'border-red-400' : ''}`} />
          </Field>
        </div>
      </Section>

      {/* ── Contact ── */}
      <Section label={t.contact}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label={t.email} error={errors.email} lang={lang}>
            <input type="email" autoComplete="email" placeholder="marie@exemple.com"
              value={data.email ?? ''} onChange={e => set('email', e.target.value)}
              className={`${base} ${errors.email ? 'border-red-400' : ''}`} />
          </Field>
          <Field label={t.phone} optional lang={lang}>
            <input type="tel" autoComplete="tel" placeholder="+1 514 000 0000"
              value={data.phone ?? ''} onChange={e => set('phone', e.target.value)}
              className={base} />
          </Field>
        </div>
      </Section>

      {/* ── Livraison ── */}
      <Section label={t.delivery}>

        {/* Pays — sélecteur prioritaire */}
        <Field label={t.country} error={errors.country} lang={lang}>
          <select
            value={data.country ?? ''}
            onChange={e => handleCountry(e.target.value)}
            className={`${baseBox} ${errors.country ? 'border-red-400' : ''}`}
          >
            <option value="">{t.selectCountry}</option>
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>{lang === 'fr' ? c.name : c.nameEn}</option>
            ))}
          </select>
        </Field>

        {/* Adresse + ville/province/postal — visibles après sélection pays */}
        {data.country && (
          <motion.div
            className="flex flex-col gap-5"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease }}
          >
            {/* Rue */}
            <Field label={t.address} error={errors.address} lang={lang}>
              <AddressAutocomplete
                value={data.address ?? ''}
                placeholder={isCanada ? '123 Rue Principale' : '123 Main Street'}
                inputClass={baseBox}
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
            </Field>

            {/* Ville · Province · Code postal */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Field label={t.city} error={errors.city} lang={lang}>
                <input type="text" autoComplete="address-level2"
                  value={data.city ?? ''} onChange={e => set('city', e.target.value)}
                  className={`${baseBox} ${errors.city ? 'border-red-400' : ''}`} />
              </Field>

              <Field label={isCanada ? t.province : t.region} lang={lang}>
                {isCanada ? (
                  <select value={data.province ?? ''} onChange={e => set('province', e.target.value)}
                    autoComplete="address-level1" className={baseBox}>
                    <option value="">{t.selectProvince}</option>
                    {CA_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                ) : (
                  <input type="text" autoComplete="address-level1"
                    value={data.province ?? ''} onChange={e => set('province', e.target.value)}
                    className={baseBox} />
                )}
              </Field>

              <Field label={t.postal(data.country)} error={errors.postalCode} lang={lang}>
                <input type="text" autoComplete="postal-code"
                  maxLength={isCanada ? 7 : 12}
                  placeholder={postalFmt.placeholder}
                  value={data.postalCode ?? ''} onChange={handlePostal}
                  className={`${baseBox} ${errors.postalCode ? 'border-red-400' : ''}`} />
                {postalHint && <span className="text-label text-[7px] text-[#7a7a8a] tracking-[1px] mt-1">{postalHint}</span>}
              </Field>
            </div>
          </motion.div>
        )}
      </Section>

      {/* Pourquoi Maison Locht */}
      <Field label={t.why} optional lang={lang}>
        <textarea placeholder={t.whyPlaceholder} rows={2}
          value={data.whyLocht ?? ''} onChange={e => set('whyLocht', e.target.value)}
          className={`${baseBox} resize-none`} />
      </Field>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-[#043672]/08">
        <button onClick={onBack} data-cursor="hover"
          className="text-label text-[9px] text-[#7a7a8a] tracking-[3px] hover:text-[#043672] transition-colors flex items-center gap-2 cursor-none">
          ← {t.back}
        </button>
        <button onClick={() => { if (validate()) onNext() }} data-cursor="hover"
          className="group relative inline-flex items-center gap-4 bg-[#043672] text-white overflow-hidden px-8 py-4 cursor-none">
          <span className="absolute inset-0 bg-[#0a4d9e] -translate-x-full group-hover:translate-x-0 transition-transform duration-[420ms] ease-[cubic-bezier(.16,1,.3,1)]" />
          <span className="relative text-label text-[9px] tracking-[3px]">{t.next}</span>
          <span className="relative text-sm group-hover:translate-x-1.5 transition-transform duration-300">→</span>
        </button>
      </div>
    </motion.div>
  )
}
