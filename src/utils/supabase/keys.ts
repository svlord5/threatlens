/**
 * Supabase Key Resolver for ThreatLens
 * Supports both modern API keys (sb_publishable_..., sb_secret_...) and backward-compatible environment variables.
 * Automatically ignores disabled legacy JWT keys (starting with 'eyJ') to prevent 401 Legacy API keys errors.
 */

export function getSupabasePublishableKey(): string {
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (publishableKey && !publishableKey.startsWith('eyJ')) {
    return publishableKey;
  }

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (anonKey && !anonKey.startsWith('eyJ')) {
    return anonKey;
  }

  // Fallback to whichever is provided if both are legacy
  return publishableKey || anonKey || '';
}

export function getSupabaseSecretKey(): string {
  // 1. Check official modern secret key
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();
  if (secretKey && !secretKey.startsWith('eyJ')) {
    return secretKey;
  }

  // 2. Check service role key if it is modern (e.g. sb_secret_... or not legacy JWT)
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (serviceRoleKey && !serviceRoleKey.startsWith('eyJ')) {
    return serviceRoleKey;
  }

  // 3. If service role key is legacy JWT ('eyJ...') which is disabled on modern Supabase projects,
  // fall back to the modern publishable key to avoid hard 401 'Legacy API keys are disabled' errors.
  const modernPublishable = getSupabasePublishableKey();
  if (modernPublishable && !modernPublishable.startsWith('eyJ')) {
    return modernPublishable;
  }

  // 4. Ultimate fallback
  return secretKey || serviceRoleKey || modernPublishable || '';
}
