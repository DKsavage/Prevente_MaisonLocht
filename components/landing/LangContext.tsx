'use client'

import { createContext, useContext, useState } from 'react'

type Lang = 'fr' | 'en'
type LangContextType = { lang: Lang; toggle: () => void }

const LangContext = createContext<LangContextType>({ lang: 'fr', toggle: () => {} })

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('fr')
  return (
    <LangContext.Provider value={{ lang, toggle: () => setLang(l => l === 'fr' ? 'en' : 'fr') }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
