import { LangProvider } from '@/components/landing/LangContext'
import Nav from '@/components/landing/Nav'
import Hero from '@/components/landing/Hero'
import Collection from '@/components/landing/Collection'
import Story from '@/components/landing/Story'
import Commander from '@/components/landing/Commander'

export default function Home() {
  return (
    <LangProvider>
      <main className="min-h-screen bg-[#faf7f2]">
        <Nav />
        <Hero />
        <Collection />
        <Story />
        <Commander />
      </main>
    </LangProvider>
  )
}
