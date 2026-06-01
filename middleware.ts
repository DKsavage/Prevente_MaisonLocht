import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const clean = (v?: string) => (v ?? '').replace(/\s/g, '')

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    clean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isLogin = path === '/admin/login'

  // Liste blanche optionnelle (ADMIN_EMAILS="a@x.com,b@y.com")
  const allowlist = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  const isAllowed = !user ? false
    : allowlist.length === 0 ? true
    : allowlist.includes((user.email ?? '').toLowerCase())

  // Protège /admin sauf la page de login
  if (path.startsWith('/admin') && !isLogin && !isAllowed) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }
  // Déjà connecté et autorisé → éviter la page de login
  if (isLogin && isAllowed) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}
