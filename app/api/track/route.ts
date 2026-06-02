import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

// Enregistre une visite (page vue). Données non personnelles : chemin, session anonyme, referrer.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const path     = String(body.path ?? '').slice(0, 200)
    const session  = String(body.session ?? '').slice(0, 64)
    const referrer = String(body.referrer ?? '').slice(0, 200)

    // Ignore l'admin et les valeurs vides
    if (!path || path.startsWith('/admin')) return NextResponse.json({ ok: true })

    const supabase = createServerClient()
    await supabase.from('visits').insert({ path, session, referrer })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 }) // jamais bloquant
  }
}
