import { createClient } from '@supabase/supabase-js'

// Nettoie les clés — un copier-coller dans Vercel peut introduire des retours
// à la ligne ou espaces qui rendent l'en-tête HTTP invalide.
const clean = (v?: string) => (v ?? '').replace(/\s/g, '')

export function createServerClient() {
  return createClient(
    clean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    clean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  )
}
