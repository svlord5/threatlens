import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getAuthorization } from '@/lib/authorization'
import { sendDiscordLog } from '@/lib/discord-log'
import { PREFILL_COOKIE, prefillCookieOptions, readPrefill, signPrefill, type Prefill } from '@/lib/prefill'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const errorParam = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  // if "next" is in param, use it as the redirect URL
  // Only same-site relative paths: reject absolute/protocol-relative/backslash tricks (open redirect).
  const rawNext = searchParams.get('next') ?? '/dashboard'
  const next = /^\/(?![/\\])[A-Za-z0-9\-._~!$&'()*+,;=:@%/?#]*$/.test(rawNext) ? rawNext : '/dashboard'

  const forwardedHost = request.headers.get('x-forwarded-host')
  const host = forwardedHost || request.headers.get('host') || 'localhost:3000'
  const isLocalHost = host.includes('localhost') || host.includes('127.0.0.1')
  const isLocalEnv = process.env.NODE_ENV === 'development' || isLocalHost
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const protocol = isLocalHost ? 'http' : (forwardedProto || (isLocalEnv ? 'http' : 'https'))
  // In production prefer the configured site URL over request headers (host-header spoofing).
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL
  const correctOrigin = !isLocalEnv && configuredUrl ? new URL(configuredUrl).origin : `${protocol}://${host}`

  if (errorParam) {
    console.error("Auth callback provider error:", errorParam, errorDescription)
    const redirectUrl = next.startsWith('/dashboard/account')
      ? `${correctOrigin}/dashboard/account?error=${encodeURIComponent(errorDescription || errorParam)}`
      : `${correctOrigin}/login?error=${encodeURIComponent(errorDescription || errorParam)}`
    return NextResponse.redirect(redirectUrl)
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error("Auth callback: Supabase exchangeCodeForSession failed:", error.message, error)
      const redirectUrl = next.startsWith('/dashboard/account')
        ? `${correctOrigin}/dashboard/account?error=${encodeURIComponent(error.message || 'auth_failed')}`
        : `${correctOrigin}/login?error=${encodeURIComponent(error.message || 'auth_failed')}`
      return NextResponse.redirect(redirectUrl)
    }

    const { data: { user } } = await supabase.auth.getUser()

    // If linking an identity (redirecting back to account page)
    const isAccountLinking = next.includes('/dashboard/account')

    const discordId = user?.identities?.find((i: any) => i.provider === 'discord')?.id
    const googleId = user?.identities?.find((i: any) => i.provider === 'google')?.id
    const providerId = discordId || googleId || user?.email || user?.user_metadata?.provider_id || user?.user_metadata?.sub

    // If user came from create-account to pre-fill their details
    const isCreateAccount = next.startsWith('/create-account') || next.startsWith('/signup')
    // Record what the provider verified (signed cookie) and go to the form with no personal data in the URL.
    const sendToAccessForm = (unregistered: boolean) => {
      const merged: Prefill = { ...(readPrefill(request) ?? {}) }
      const gIdent = user?.identities?.find((i: any) => i.provider === 'google')
      const dIdent = user?.identities?.find((i: any) => i.provider === 'discord')

      if (gIdent && user?.email && user.email_confirmed_at) {
        const email = user.email.trim().toLowerCase()
        const idData: any = gIdent.identity_data ?? {}
        const cleanName = String(idData.full_name || idData.name || '').replace(/[^a-zA-Z\s.'-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 70)
        merged.email = email
        merged.fullName = cleanName.length >= 2 ? cleanName : 'Verified User'
      }
      if (dIdent?.id) {
        const idData: any = dIdent.identity_data ?? {}
        merged.discordId = String(dIdent.id)
        merged.discordName = String(idData.global_name || idData.full_name || idData.name || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 60)
      }

      const redirectUrl = new URL(`${correctOrigin}/create-account`)
      redirectUrl.searchParams.set('prefill', gIdent ? 'google' : dIdent ? 'discord' : 'oauth')
      if (unregistered) redirectUrl.searchParams.set('unregistered', '1')
      const response = NextResponse.redirect(redirectUrl.toString())
      const signed = signPrefill(merged)
      if (signed) response.cookies.set(PREFILL_COOKIE, signed, prefillCookieOptions(!isLocalEnv))
      return response
    }

    if (isCreateAccount && user) {
      await supabase.auth.signOut().catch((err) => console.warn("Sign out during create-account prefill ignored:", err))
      return sendToAccessForm(false)
    }

    // Same server-side rule the proxy and API routes enforce (invite list or super admin).
    const authz = user ? await getAuthorization(user) : { authorized: false, isAdmin: false }
    const isAllowed = authz.authorized || isAccountLinking

    if (!isAllowed) {
      // Signed in, but not on the whitelist: send them to the access-request form.
      await supabase.auth.signOut().catch((err) => console.warn("Sign out during unauthorized redirect ignored:", err))
      return sendToAccessForm(true)
    }

    // Log successful authentication or linking
    try {
      const providerName = user?.app_metadata?.provider || (googleId ? 'google' : (discordId ? 'discord' : 'email'))
      await sendDiscordLog({
        action: isAccountLinking ? 'LINK_IDENTITY' : 'LOGIN',
        user,
        metadata: isAccountLinking
          ? `User linked ${providerName} identity.`
          : `User successfully authenticated via ${providerName}.`,
      })
    } catch (err) {
      console.error("Failed to log authentication event to Discord")
    }

    return NextResponse.redirect(`${correctOrigin}${next}`)
  }

  // Fallback when code is missing
  console.warn("Auth callback invoked without code or error parameter:", request.url)
  return NextResponse.redirect(`${correctOrigin}/login?error=auth_failed`)
}
