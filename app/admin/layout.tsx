import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Maison Locht — Administration',
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#ede8df]">{children}</div>
}
