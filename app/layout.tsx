import type { Metadata } from 'next'
import { Cormorant_Garamond, DM_Sans, JetBrains_Mono } from 'next/font/google'
import SiteChrome from '@/components/SiteChrome'
import { Analytics } from '@vercel/analytics/next'
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://prevente.maisonlocht.com'),
  title: 'Maison Locht — Pré-vente 2026',
  description: 'Pré-vente exclusive. Sacs et casquettes artisanaux, façonnés à la main. Sacs uniques, casquettes en édition limitée.',
  openGraph: {
    title: 'Maison Locht — Pré-vente 2026',
    description: 'Pré-vente exclusive. Sacs et casquettes artisanaux, façonnés à la main. Sacs uniques, casquettes en édition limitée.',
    locale: 'fr_CA',
    images: [{ url: '/images/4mannequins.jpeg', width: 1200, height: 800, alt: 'Maison Locht — Pré-vente 2026' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Maison Locht — Pré-vente 2026',
    description: 'Pré-vente exclusive. Sacs et casquettes artisanaux, façonnés à la main.',
    images: ['/images/4mannequins.jpeg'],
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
      <body>
        <SiteChrome>{children}</SiteChrome>
        <Analytics />
      </body>
    </html>
  )
}
