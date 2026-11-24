import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabasePublishableKey } from './keys';
import { isDemoMode } from '@/lib/demo';
import { getSharedMockSupabase } from '@/lib/demo/mock-supabase';

export async function createClient() {
  // Demo mode: an in-memory fake with synthetic data; no network, no keys.
  if (isDemoMode()) return getSharedMockSupabase() as unknown as SupabaseClient;
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}
