import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// Liste publique des pièces avec leur statut (available | reserved | sold)
export async function GET() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('pieces')
      .select('id, model, image_url, status, sort_order, display_num')
      .order('model', { ascending: true })
      .order('display_num', { ascending: true, nullsFirst: false })
      .order('sort_order', { ascending: true })

    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('[pieces GET]', err)
    return NextResponse.json([], { status: 500 })
  }
}
