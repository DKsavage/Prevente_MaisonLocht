'use client'

import { usePathname } from 'next/navigation'
import Cursor from './landing/Cursor'
import LenisProvider from './landing/LenisProvider'
import ScrollToTop from './landing/ScrollToTop'

// Curseur custom + smooth scroll uniquement sur le site vitrine, pas l'admin
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin')

  if (isAdmin) return <>{children}</>

  return (
    <>
      <Cursor />
      <LenisProvider>
        {children}
        <ScrollToTop />
      </LenisProvider>
    </>
  )
}
