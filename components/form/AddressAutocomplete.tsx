'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

type AddressResult = {
  address: string
  city: string
  province: string
  postalCode: string
}

type Props = {
  value: string
  placeholder?: string
  inputClass: string
  hasError?: boolean
  lang: 'fr' | 'en'
  country?: string
  province?: string
  city?: string
  onSelect: (r: AddressResult) => void
  onChange: (v: string) => void
}

export default function AddressAutocomplete({
  value, placeholder, inputClass, hasError, lang,
  country, province, city, onSelect, onChange,
}: Props) {
  const [results, setResults] = useState<AddressResult[]>([])
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  const timerRef              = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef          = useRef<HTMLDivElement>(null)

  const hint = lang === 'fr'
    ? 'Continuez à saisir pour voir les suggestions…'
    : 'Keep typing to see suggestions…'

  const search = useCallback(async (q: string) => {
    if (q.length < 3) { setResults([]); setOpen(false); return }
    setLoading(true)
    try {
      const params = new URLSearchParams({ q })
      if (country)  params.set('country', country)
      if (province) params.set('province', province)
      if (city)     params.set('city', city)
      const res = await fetch(`/api/address-search?${params}`)
      const data: AddressResult[] = await res.json()
      setResults(data)
      setOpen(data.length > 0)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [country, province, city])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    onChange(v)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => search(v), 380)
  }

  const handleSelect = (r: AddressResult) => {
    onSelect(r)
    setOpen(false)
    setResults([])
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleInput}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete="off"
          className={`${inputClass} ${hasError ? 'border-red-400' : ''} pr-8`}
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="block w-3 h-3 border border-[#b8965a] border-t-transparent rounded-full animate-spin" />
          </span>
        )}
        {!loading && value.length >= 3 && !open && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b8965a]/50 text-[10px]">↓</span>
        )}
      </div>

      {/* Suggestions */}
      {open && results.length > 0 && (
        <div className="absolute z-50 left-0 right-0 top-full mt-0.5 bg-[#faf7f2] border border-[#043672]/15 shadow-[0_8px_32px_rgba(4,54,114,0.12)] max-h-[220px] overflow-y-auto">
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleSelect(r) }}
              className="w-full text-left px-4 py-2.5 hover:bg-[#f0ebe0] transition-colors duration-150 border-b border-[#043672]/06 last:border-0 cursor-none"
              data-cursor="hover"
            >
              <span className="text-[13px] text-[#1a1a2e] font-light block">{r.address}</span>
              <span className="text-label text-[8px] text-[#7a7a8a] tracking-[1px]">
                {[r.city, r.province, r.postalCode].filter(Boolean).join(' · ')}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Hint */}
      {focused && value.length > 0 && value.length < 3 && (
        <div className="absolute z-50 left-0 right-0 top-full mt-0.5 bg-[#f0ebe0] border border-[#043672]/10 px-4 py-2">
          <span className="text-label text-[8px] text-[#7a7a8a] tracking-[1px]">{hint}</span>
        </div>
      )}
    </div>
  )
}
