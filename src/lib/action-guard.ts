import { headers } from "next/headers";
import { requireAuth } from "@/lib/api-auth";
import { rateLimit, type RateGroup } from "@/lib/rate-limit";
import { DEMO_MESSAGE, isDemoMode } from "@/lib/demo";

const internalRequest = async () => new Request("http://internal.invalid/", { headers: await headers() });

/**
 * Auth + rate limit for server actions (which are public POST endpoints too).
 * Outbound-API actions are also refused for demo users.
 * Returns an error message to hand back to the caller, or null when allowed.
 */
export async function guardAction(groups: RateGroup[]): Promise<string | null> {
  const request = await internalRequest();
  const authz = await requireAuth(request, { blockDemo: true });
  if (!authz.ok) {
    const body = (await authz.response.json().catch(() => null)) as { error?: string } | null;
    return body?.error ?? "Unauthorized";
  }
  const limited = await rateLimit(request, authz, groups);
  if (limited) {
    const body = (await limited.json().catch(() => null)) as { error?: string } | null;
    return body?.error ?? "Rate limit exceeded";
  }
  return null;
}

/**
 * Put at the top of every mutating server action. Refuses demo users; leaves
 * existing behaviour (Supabase RLS etc.) untouched for everyone else.
 */
export async function blockInDemo(): Promise<string | null> {
  if (isDemoMode()) return DEMO_MESSAGE;
  const authz = await requireAuth(await internalRequest());
  return authz.ok && authz.isDemo ? DEMO_MESSAGE : null;
}
