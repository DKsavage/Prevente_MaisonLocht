'use client'

import { usePathname } from 'next/navigation'
import Cursor from './landing/Cursor'
import LenisProvider from './landing/LenisProvider'
import ScrollToTop from './landing/ScrollToTop'
import VisitTracker from './VisitTracker'

// Curseur custom + smooth scroll uniquement sur le site vitrine, pas l'admin
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin')

  if (isAdmin) return <>{children}</>

  return (
    <>
      <Cursor />
      <VisitTracker />
      <LenisProvider>
        {children}
        <ScrollToTop />
      </LenisProvider>
    </>
  )
}
