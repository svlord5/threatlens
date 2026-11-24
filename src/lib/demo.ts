/**
 * Demo mode: the app runs on synthetic, in-memory data with no external services.
 *
 * It is ON when
 *   - no Supabase project is configured (NEXT_PUBLIC_SUPABASE_URL and a publishable/anon
 *     key are not both set), or
 *   - NEXT_PUBLIC_DEMO_MODE=true (force it, even if Supabase is configured).
 *
 * Set the real environment values and it switches to live mode by itself.
 *
 * (Public sample data: src/lib/demo/data.ts. Fake client: src/lib/demo/mock-supabase.ts.)
 *
 * In demo mode nobody has to sign in (any credentials work), data is fake and resets on
 * reload, and ingest, isolation, admin changes and outbound API calls (VirusTotal, Shodan,
 * Gemini, website scans, Discord, Wazuh) are disabled.
 *
 * Separately, DEMO_ACCOUNT_EMAIL makes one account on a LIVE deployment read-only.
 *
 * NOTE: only NEXT_PUBLIC_* variables are visible to browser code, so demo detection must
 * rely on them to agree between server and client.
 */
export const DEMO_MESSAGE = "This action is disabled in demo mode.";

export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

let warned = false;
export function isDemoMode(): boolean {
  const forced = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const demo = forced || !isSupabaseConfigured();
  if (demo && !forced && !warned && typeof window === "undefined" && process.env.NODE_ENV === "production") {
    warned = true;
    console.warn(
      "[demo] Supabase is not configured, so this deployment is running in DEMO mode with synthetic data. " +
        "If this is a real deployment, set NEXT_PUBLIC_SUPABASE_URL and a publishable key."
    );
  }
  return demo;
}

export function isDemoEmail(email?: string | null): boolean {
  const demo = process.env.DEMO_ACCOUNT_EMAIL?.trim().toLowerCase();
  return !!demo && !!email && email.trim().toLowerCase() === demo;
}
