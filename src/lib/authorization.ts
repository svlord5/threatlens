import { createClient, type User } from "@supabase/supabase-js";
import { getSupabaseSecretKey } from "@/utils/supabase/keys";
import { isDemoEmail } from "@/lib/demo";

/**
 * Server-side authorization: is this signed-in Supabase user actually allowed in?
 *
 * Authentication (a valid Supabase session) is NOT enough: Supabase can mint a
 * session for anyone who signs up or signs in with an enabled provider. A user
 * is authorized only if they are
 *   - the super admin (SUPER_ADMIN_DISCORD_ID, or SUPER_ADMIN_EMAIL), or
 *   - the demo account (DEMO_ACCOUNT_EMAIL, read-only), or
 *   - listed in iam_discord_invites (matched by Discord ID or email) and not expired.
 *
 * Only server-set data is trusted: `identities` and `email_confirmed_at`.
 * `user_metadata` is editable by the user (supabase.auth.updateUser) and is never used.
 * Email matches require a confirmed email.
 */

export interface Authorization {
  authorized: boolean;
  isAdmin: boolean;
}

const DENIED: Authorization = { authorized: false, isAdmin: false };
const TTL_MS = 30_000;
const cache = new Map<string, { value: Authorization; expires: number }>();

let admin: ReturnType<typeof createClient> | null = null;
function adminClient() {
  if (!admin) {
    admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, getSupabaseSecretKey(), {
      auth: { persistSession: false },
    });
  }
  return admin;
}

export async function getAuthorization(user: User): Promise<Authorization> {
  const hit = cache.get(user.id);
  if (hit && hit.expires > Date.now()) return hit.value;

  let value: Authorization;
  try {
    value = await compute(user);
  } catch (err) {
    console.error("[authorization] lookup failed; denying:", err instanceof Error ? err.message : err);
    return DENIED; // fail closed, and do not cache the failure
  }
  cache.set(user.id, { value, expires: Date.now() + TTL_MS });
  if (cache.size > 2000) {
    const now = Date.now();
    for (const [k, v] of cache) if (v.expires <= now) cache.delete(k);
  }
  return value;
}

async function compute(user: User): Promise<Authorization> {
  const discordId = user.identities?.find((i) => i.provider === "discord")?.id;
  const email = user.email_confirmed_at ? user.email?.trim().toLowerCase() : undefined;

  const adminId = process.env.SUPER_ADMIN_DISCORD_ID || process.env.NEXT_PUBLIC_SUPER_ADMIN_ID;
  const adminEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  if ((adminId && discordId === adminId) || (adminEmail && email === adminEmail)) {
    return { authorized: true, isAdmin: true };
  }

  if (isDemoEmail(email)) return { authorized: true, isAdmin: false };

  const keys = [discordId, email].filter((k): k is string => !!k);
  if (keys.length === 0) return DENIED;

  const { data, error } = await adminClient()
    .from("iam_discord_invites")
    .select("discord_id, valid_until, super_admin")
    .in("discord_id", keys);
  if (error) throw error;

  const now = Date.now();
  const active = (data ?? []).filter(
    (row: { valid_until: string | null }) => !row.valid_until || new Date(row.valid_until).getTime() > now
  );
  if (active.length === 0) return DENIED;
  return { authorized: true, isAdmin: active.some((r: { super_admin: boolean | null }) => r.super_admin === true) };
}
