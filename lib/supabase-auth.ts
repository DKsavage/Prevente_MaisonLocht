import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const clean = (v?: string) => (v ?? '').replace(/\s/g, '')

// Client Supabase côté serveur basé sur les cookies (session admin)
export async function createAuthClient() {
  const cookieStore = await cookies()
  return createServerClient(
    clean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options))
          } catch {
            // appelé depuis un Server Component — ignoré (le middleware rafraîchit)
          }
        },
      },
    }
  )
}
