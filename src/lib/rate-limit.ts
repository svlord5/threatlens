import { NextResponse } from "next/server";
import { createHash } from "crypto";
import type { AuthResult } from "@/lib/api-auth";

/**
 * Rate limiting for expensive routes (forensics, VirusTotal, Shodan, Gemini).
 *
 *  - per-user and per-IP fixed-window limits for each group
 *  - a global daily cap for groups that cost money/quota (Gemini, VirusTotal)
 *
 * Store: Upstash Redis over REST (works on Vercel, no extra dependency) when
 * UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set. Otherwise an
 * in-memory map is used, which is per-instance only: fine for local dev, NOT a
 * real limit on serverless. If the Upstash call fails, requests are rejected
 * (fail closed) unless RATE_LIMIT_FAIL_OPEN=true.
 *
 * Every limit is configurable (integers, 0 = unlimited):
 *   RATE_LIMIT_<GROUP>_USER_PER_MIN   RATE_LIMIT_<GROUP>_IP_PER_MIN
 *   RATE_LIMIT_<GROUP>_USER_PER_DAY   (per user)
 *   RATE_LIMIT_<GROUP>_DAILY_CAP      (global, all users)
 * with GROUP in FORENSICS, VIRUSTOTAL, SHODAN, GEMINI.
 */

export type RateGroup = "forensics" | "virustotal" | "shodan" | "gemini";

// Strict defaults (per minute, per user/IP; per-user and global per day). 0 = unlimited.
// VirusTotal's free tier is 4 requests/minute and 500/day, so stay below it.
const DEFAULTS: Record<RateGroup, { user: number; ip: number; userDaily: number; daily: number }> = {
  forensics: { user: 10, ip: 20, userDaily: 200, daily: 2000 },
  virustotal: { user: 4, ip: 8, userDaily: 100, daily: 400 },
  shodan: { user: 4, ip: 8, userDaily: 40, daily: 150 },
  gemini: { user: 6, ip: 12, userDaily: 60, daily: 300 },
};

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function limitsFor(group: RateGroup) {
  const g = group.toUpperCase();
  const d = DEFAULTS[group];
  return {
    user: envInt(`RATE_LIMIT_${g}_USER_PER_MIN`, d.user),
    userDaily: envInt(`RATE_LIMIT_${g}_USER_PER_DAY`, d.userDaily),
    ip: envInt(`RATE_LIMIT_${g}_IP_PER_MIN`, d.ip),
    daily: envInt(`RATE_LIMIT_${g}_DAILY_CAP`, d.daily),
  };
}

// ---- stores ---------------------------------------------------------------

const memory = new Map<string, { count: number; expires: number }>();

function memoryIncr(key: string, ttlSeconds: number): number {
  const now = Date.now();
  if (memory.size > 5000) {
    for (const [k, v] of memory) if (v.expires <= now) memory.delete(k);
  }
  const entry = memory.get(key);
  if (!entry || entry.expires <= now) {
    memory.set(key, { count: 1, expires: now + ttlSeconds * 1000 });
    return 1;
  }
  entry.count += 1;
  return entry.count;
}

async function upstashIncr(key: string, ttlSeconds: number): Promise<number> {
  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const res = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify([
      ["INCR", key],
      ["EXPIRE", key, String(ttlSeconds), "NX"],
    ]),
    signal: AbortSignal.timeout(2500),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Upstash responded ${res.status}`);
  const out = (await res.json()) as Array<{ result?: number; error?: string }>;
  if (out[0]?.error || typeof out[0]?.result !== "number") throw new Error("Upstash INCR failed");
  return out[0].result;
}

const usingUpstash = () => !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

let warnedMemory = false;
async function incr(key: string, ttlSeconds: number): Promise<number> {
  if (usingUpstash()) return upstashIncr(key, ttlSeconds);
  if (process.env.NODE_ENV === "production" && !warnedMemory) {
    warnedMemory = true;
    console.error(
      "[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN not set in production: using per-instance memory, limits are NOT enforced across serverless instances."
    );
  }
  return memoryIncr(key, ttlSeconds);
}

// ---- public API -----------------------------------------------------------

export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

const tooMany = (message: string, retryAfter: number) =>
  NextResponse.json({ error: message }, { status: 429, headers: { "Retry-After": String(retryAfter) } });

/**
 * Count this request against each group. Returns a 429/503 response when a
 * limit is exceeded, otherwise null. Call it right after requireAuth().
 */
export async function rateLimit(
  request: Request,
  authz: Extract<AuthResult, { ok: true }>,
  groups: RateGroup[]
): Promise<NextResponse | null> {
  const ip = clientIp(request);
  const subject = authz.userId ? `u:${authz.userId}` : `a:${authz.via}`;
  const minute = Math.floor(Date.now() / 60000);
  const day = new Date().toISOString().slice(0, 10);

  try {
    for (const group of groups) {
      const lim = limitsFor(group);
      if (lim.user > 0 && (await incr(`rl:${group}:user:${subject}:${minute}`, 70)) > lim.user) {
        return tooMany(`Rate limit exceeded for ${group}. Try again in a minute.`, 60);
      }
      if (lim.ip > 0 && (await incr(`rl:${group}:ip:${ip}:${minute}`, 70)) > lim.ip) {
        return tooMany(`Rate limit exceeded for ${group}. Try again in a minute.`, 60);
      }
      if (lim.userDaily > 0 && (await incr(`rl:${group}:userday:${subject}:${day}`, 90000)) > lim.userDaily) {
        return tooMany(`Daily ${group} limit reached for your account. Try again tomorrow.`, 3600);
      }
      if (lim.daily > 0 && (await incr(`rl:${group}:daily:${day}`, 90000)) > lim.daily) {
        return tooMany(`Daily ${group} quota reached. Try again tomorrow.`, 3600);
      }
    }
  } catch (err) {
    console.error("[rate-limit] store error:", err instanceof Error ? err.message : err);
    if (process.env.RATE_LIMIT_FAIL_OPEN !== "true") {
      return NextResponse.json({ error: "Rate limiter unavailable" }, { status: 503 });
    }
  }
  return null;
}

/**
 * Limit by an arbitrary key (for example an email address) rather than an IP.
 * The key is hashed, so no personal data is stored in the rate-limit store.
 */
export async function rateLimitKey(
  name: string,
  key: string,
  limit: number,
  windowSeconds: number
): Promise<NextResponse | null> {
  const effective = envInt(`RATE_LIMIT_${name.toUpperCase()}`, limit);
  if (effective === 0) return null;
  const digest = createHash("sha256").update(key.toLowerCase()).digest("hex").slice(0, 32);
  const bucket = Math.floor(Date.now() / (windowSeconds * 1000));
  try {
    const count = await incr(`rl:${name}:key:${digest}:${bucket}`, windowSeconds + 10);
    if (count > effective) return tooMany("A request for this address was already received. Try again later.", windowSeconds);
  } catch (err) {
    console.error("[rate-limit] store error:", err instanceof Error ? err.message : err);
    if (process.env.RATE_LIMIT_FAIL_OPEN !== "true") {
      return NextResponse.json({ error: "Rate limiter unavailable" }, { status: 503 });
    }
  }
  return null;
}

/**
 * Plain per-IP fixed-window limiter for public/unauthenticated endpoints.
 * `limit` requests per `windowSeconds`; the env var `RATE_LIMIT_<NAME>` (integer) overrides `limit`.
 */
export async function rateLimitIp(
  request: Request,
  name: string,
  limit: number,
  windowSeconds: number
): Promise<NextResponse | null> {
  const effective = envInt(`RATE_LIMIT_${name.toUpperCase()}`, limit);
  if (effective === 0) return null;
  const bucket = Math.floor(Date.now() / (windowSeconds * 1000));
  try {
    const count = await incr(`rl:${name}:ip:${clientIp(request)}:${bucket}`, windowSeconds + 10);
    if (count > effective) return tooMany("Too many requests. Slow down.", windowSeconds);
  } catch (err) {
    console.error("[rate-limit] store error:", err instanceof Error ? err.message : err);
    if (process.env.RATE_LIMIT_FAIL_OPEN !== "true") {
      return NextResponse.json({ error: "Rate limiter unavailable" }, { status: 503 });
    }
  }
  return null;
}
