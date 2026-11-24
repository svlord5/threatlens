import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabasePublishableKey } from './keys';
import { isDemoMode } from '@/lib/demo';
import { getSharedMockSupabase } from '@/lib/demo/mock-supabase';

export function createClient() {
  // Demo mode: an in-memory fake with synthetic data; no network, no keys.
  if (isDemoMode()) return getSharedMockSupabase() as unknown as SupabaseClient;
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getSupabasePublishableKey()
  );
}
