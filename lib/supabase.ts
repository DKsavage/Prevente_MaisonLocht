import { createBrowserClient } from '@supabase/ssr'

const clean = (v?: string) => (v ?? '').replace(/\s/g, '')

export function createClient() {
  return createBrowserClient(
    clean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  )
}
