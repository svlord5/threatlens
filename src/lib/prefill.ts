import { createHmac, timingSafeEqual } from "crypto";
import { getSupabaseSecretKey } from "@/utils/supabase/keys";

/**
 * Verified identity for the access-request form.
 *
 * Name and email come from a Google sign-in and the Discord ID from a Discord
 * sign-in. The auth callback records what the provider told us in a short-lived,
 * HMAC-signed, httpOnly cookie. The form shows those values read-only, and the
 * API uses the cookie, NEVER the values in the request body, so editing the
 * form (or crafting a request) cannot change who the application is for.
 */

export const PREFILL_COOKIE = "tl_prefill";
export const PREFILL_TTL_SECONDS = 30 * 60;

export interface Prefill {
  fullName?: string;
  email?: string;
  discordId?: string;
  discordName?: string;
}

interface Payload extends Prefill {
  exp: number;
}

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64url");

function key(): string | null {
  const k = process.env.ACCESS_PREFILL_SECRET || getSupabaseSecretKey();
  return k && k.length >= 8 ? k : null;
}

const mac = (data: string, secret: string) => createHmac("sha256", secret).update(data).digest("base64url");

export function signPrefill(prefill: Prefill): string | null {
  const secret = key();
  if (!secret) return null;
  const body = b64(JSON.stringify({ ...prefill, exp: Math.floor(Date.now() / 1000) + PREFILL_TTL_SECONDS } satisfies Payload));
  return `${body}.${mac(body, secret)}`;
}

export function verifyPrefill(token: string | null | undefined): Prefill | null {
  const secret = key();
  if (!secret || !token || token.length > 4096) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = mac(body, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Payload;
    if (typeof p.exp !== "number" || p.exp < Date.now() / 1000) return null;
    const { fullName, email, discordId, discordName } = p;
    return { fullName, email, discordId, discordName };
  } catch {
    return null;
  }
}

export function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return undefined;
}

export function readPrefill(request: Request): Prefill | null {
  return verifyPrefill(readCookie(request, PREFILL_COOKIE));
}

export const prefillCookieOptions = (secure: boolean, maxAge = PREFILL_TTL_SECONDS) => ({
  httpOnly: true,
  secure,
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});
