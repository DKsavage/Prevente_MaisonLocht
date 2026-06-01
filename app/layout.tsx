import type { Metadata } from 'next'
import { Cormorant_Garamond, DM_Sans, JetBrains_Mono } from 'next/font/google'
import Cursor from '@/components/landing/Cursor'
import LenisProvider from '@/components/landing/LenisProvider'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Maison Locht — Collection LES CERNES',
  description: 'Pré-vente exclusive. Sacs artisanaux en wax, pagnes et tissé fouta. Pièces uniques, jamais reproduites.',
  openGraph: {
    title: 'Maison Locht — Collection LES CERNES',
    description: 'Pré-vente exclusive. Sacs artisanaux en wax, pagnes et tissé fouta.',
    locale: 'fr_CA',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="fr"
      className={`${cormorant.variable} ${dmSans.variable} ${jetbrains.variable}`}
    >
      <body className="cursor-none">
        <Cursor />
        <LenisProvider>
          {children}
        </LenisProvider>
      </body>
    </html>
  )
}
