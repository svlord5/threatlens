import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { rateLimitIp } from '@/lib/rate-limit'

export const proxy = async (request: NextRequest) => {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/')) {
    // API routes authenticate themselves (see src/lib/api-auth.ts) and answer
    // 401 JSON. Only login/auth and the Turnstile site key are public; the SIEM
    // ingest and Wazuh webhook routes require the agent bearer token. Skip the
    // Supabase cookie-refresh redirect below, which would turn a 401 into an
    // HTML redirect for API clients.
    // Global per-IP ceiling for every API route (before any work is done).
    // Agent routes get a higher bucket of their own; all numbers are env-tunable
    // (RATE_LIMIT_API, RATE_LIMIT_INGEST).
    const isAgentRoute = pathname.startsWith('/api/siem/ingest') || pathname.startsWith('/api/integrations/');
    const limited = isAgentRoute
      ? await rateLimitIp(request, 'ingest', 120, 60)
      : await rateLimitIp(request, 'api', 60, 60);
    if (limited) return limited;
    return NextResponse.next();
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
