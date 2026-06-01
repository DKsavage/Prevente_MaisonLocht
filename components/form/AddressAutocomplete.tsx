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
  const abortRef              = useRef<AbortController | null>(null)

  const search = useCallback(async (q: string) => {
    if (q.length < 3) {
      setResults([])
      setOpen(false)
      setLoading(false)
      return
    }
    // Annuler la requête précédente
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    setLoading(true)
    try {
      const params = new URLSearchParams({ q })
      if (country)  params.set('country', country)
      if (province) params.set('province', province)
      if (city)     params.set('city', city)
      const res = await fetch(`/api/address-search?${params}`, {
        signal: abortRef.current.signal,
      })
      const data: AddressResult[] = await res.json()
      setResults(data)
      setOpen(data.length > 0)
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setResults([])
    } finally {
      setLoading(false)
    }
  }, [country, province, city])

  // Ref toujours à jour — évite les closures stales dans le timer
  const searchRef = useRef(search)
  useEffect(() => { searchRef.current = search }, [search])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    onChange(v)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (v.length === 0) {
      setResults([])
      setOpen(false)
      setLoading(false)
      return
    }
    timerRef.current = setTimeout(() => searchRef.current(v), 360)
  }

  const handleClear = () => {
    onChange('')
    setResults([])
    setOpen(false)
    setLoading(false)
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

  const hint = lang === 'fr'
    ? '3 caractères minimum pour voir les suggestions'
    : 'At least 3 characters to see suggestions'

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
          className={`${inputClass} ${hasError ? 'border-red-400' : ''} pr-16`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {loading && (
            <span className="block w-3 h-3 border border-[#b8965a] border-t-transparent rounded-full animate-spin flex-shrink-0" />
          )}
          {value.length > 0 && !loading && (
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); handleClear() }}
              className="text-[#7a7a8a]/50 hover:text-[#043672] text-base leading-none cursor-none transition-colors"
              tabIndex={-1}
              data-cursor="hover"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Suggestions */}
      {open && results.length > 0 && (
        <div className="absolute z-50 left-0 right-0 top-full mt-px bg-[#faf7f2] border border-[#043672]/15 shadow-[0_12px_40px_rgba(4,54,114,0.1)] max-h-[220px] overflow-y-auto">
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={e => { e.preventDefault(); handleSelect(r) }}
              className="w-full text-left px-4 py-3 hover:bg-[#f0ebe0] transition-colors duration-150 border-b border-[#043672]/05 last:border-0 cursor-none"
              data-cursor="hover"
            >
              <span className="text-[13px] text-[#1a1a2e] font-light block leading-snug">{r.address}</span>
              <span className="text-label text-[8px] text-[#7a7a8a] tracking-[1px] mt-0.5 block">
                {[r.city, r.province, r.postalCode].filter(Boolean).join(' · ')}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Hint minimal */}
      {focused && value.length > 0 && value.length < 3 && (
        <div className="absolute z-40 left-0 right-0 top-full mt-px bg-[#f0ebe0]/95 border border-[#043672]/08 px-4 py-2">
          <span className="text-label text-[8px] text-[#7a7a8a] tracking-[1px]">{hint}</span>
        </div>
      )}
    </div>
  )
}
