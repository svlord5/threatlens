import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabasePublishableKey } from './keys'
import { getAuthorization } from '@/lib/authorization'
import { isDemoMode } from '@/lib/demo'

export async function updateSession(request: NextRequest) {
  // Demo mode: nobody signs in, so there is no session to refresh or gate.
  if (isDemoMode()) return NextResponse.next({ request })

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with cross-browser cookies.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/forgot-password') &&
    !request.nextUrl.pathname.startsWith('/forgot-pass') &&
    !request.nextUrl.pathname.startsWith('/create-account') &&
    !request.nextUrl.pathname.startsWith('/signup') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/api/siem/ingest') &&
    !request.nextUrl.pathname.startsWith('/api/integrations') &&
    !request.nextUrl.pathname.startsWith('/blog') &&
    request.nextUrl.pathname !== '/'
  ) {
    // no user, respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('error', 'unauthorized')
    return NextResponse.redirect(url)
  }

  // Authentication is not authorization: a valid Supabase session can belong to anyone
  // who signed up or used an enabled provider. Enforce the whitelist on the server for
  // the dashboard and for every Server Action (POSTs carrying a Next-Action header).
  const path = request.nextUrl.pathname
  const isServerAction = request.headers.has('next-action')

  if (isServerAction && !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (user && (path.startsWith('/dashboard') || isServerAction)) {
    const authz = await getAuthorization(user)
    if (!authz.authorized) {
      if (isServerAction) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      await supabase.auth.signOut().catch(() => {})
      const url = request.nextUrl.clone()
      url.pathname = '/create-account'
      url.search = ''
      url.searchParams.set('unregistered', '1')
      const redirect = NextResponse.redirect(url)
      supabaseResponse.cookies.getAll().forEach((c) => redirect.cookies.set(c))
      return redirect
    }
    if (path.startsWith('/dashboard/admin') && !authz.isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      url.search = ''
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
