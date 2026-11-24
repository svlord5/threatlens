import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import { createClient } from "@/utils/supabase/server";
import { DEMO_MESSAGE, isDemoEmail, isDemoMode } from "@/lib/demo";
import { getAuthorization } from "@/lib/authorization";

/**
 * Shared authorization for API route handlers.
 *
 * A request is authenticated if it carries EITHER:
 *   - a valid Supabase user session (cookie), or
 *   - (only when `allowAgentToken` is set) the SIEM agent bearer token.
 *
 * Failures return a plain 401 JSON response. Anything that errors while
 * verifying fails closed.
 */

type AuthOk = { ok: true; via: "session" | "agent"; userId?: string; email?: string; isAdmin: boolean; isDemo: boolean };
type AuthFail = { ok: false; response: NextResponse };

export type AuthResult = AuthOk | AuthFail;

export interface RequireAuthOptions {
  /** Also accept `Authorization: Bearer <SIEM_AGENT_API_KEY>` (machine-to-machine routes). */
  allowAgentToken?: boolean;
  /** Only admins (super admin or an invite with super_admin=true) may proceed. */
  adminOnly?: boolean;
  /** Reject user sessions; accept the agent token only. */
  agentOnly?: boolean;
  /** Return 403 for demo users (and for everyone, including agents, in demo mode). */
  blockDemo?: boolean;
}

const unauthorized = (): AuthFail => ({
  ok: false,
  response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
});

const forbidden = (): AuthFail => ({
  ok: false,
  response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
});

const demoForbidden = (): AuthFail => ({
  ok: false,
  response: NextResponse.json({ error: DEMO_MESSAGE }, { status: 403 }),
});

const sha256 = (v: string) => createHash("sha256").update(v).digest();

/** Constant-time check of the agent bearer token. No default key: unset env => always false. */
export function hasValidAgentToken(request: Request): boolean {
  const expected = process.env.SIEM_AGENT_API_KEY;
  if (!expected) return false;
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer (.+)$/i.exec(header);
  if (!match) return false;
  return timingSafeEqual(sha256(match[1]), sha256(expected));
}

async function getSupabaseUser() {
  try {
    const supabase = await createClient();
    // getUser() validates the JWT with Supabase; getSession() alone does not.
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user;
  } catch {
    return null;
  }
}

export async function requireAuth(
  request: Request,
  options: RequireAuthOptions = {}
): Promise<AuthResult> {
  if (options.blockDemo && isDemoMode() && (options.agentOnly || hasValidAgentToken(request))) {
    return demoForbidden();
  }

  // Demo mode has no sign-in: everyone is the read-only demo analyst, and the agent
  // routes (ingest, Wazuh) are blocked above via blockDemo.
  if (isDemoMode() && !options.agentOnly) {
    if (options.blockDemo) return demoForbidden();
    return { ok: true, via: "session", userId: "demo-user", email: "demo@example.com", isAdmin: false, isDemo: true };
  }

  if (options.allowAgentToken || options.agentOnly) {
    if (!process.env.SIEM_AGENT_API_KEY) {
      // Fail closed: never fall back to a default key.
      console.error("[api-auth] SIEM_AGENT_API_KEY is not set; refusing agent-authenticated request.");
      if (options.agentOnly) {
        return {
          ok: false,
          response: NextResponse.json({ error: "Server misconfigured" }, { status: 500 }),
        };
      }
    }
    if (hasValidAgentToken(request)) {
      // The agent token is never an admin identity.
      return options.adminOnly ? forbidden() : { ok: true, via: "agent", isAdmin: false, isDemo: false };
    }
    if (options.agentOnly) return unauthorized();
  }

  const supabaseUser = await getSupabaseUser();
  if (supabaseUser) {
    // A valid session only proves who they are, not that they are allowed in.
    const authorization = await getAuthorization(supabaseUser);
    if (!authorization.authorized) return forbidden();
    const isDemo = isDemoMode() || isDemoEmail(supabaseUser.email);
    if (isDemo && options.blockDemo) return demoForbidden();
    const isAdmin = !isDemo && authorization.isAdmin;
    if (options.adminOnly && !isAdmin) return forbidden();
    return { ok: true, via: "session", userId: supabaseUser.id, email: supabaseUser.email, isAdmin, isDemo };
  }

  return unauthorized();
}
