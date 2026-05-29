/** Server-only env checks (used in layouts / middleware). */
export function getServerConfigError(): string | null {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return 'NEXT_PUBLIC_SUPABASE_URL is not set';
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return 'NEXT_PUBLIC_SUPABASE_ANON_KEY is not set';
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return 'SUPABASE_SERVICE_ROLE_KEY is not set (required for profiles and data)';
  }
  return null;
}

export function isServerConfigured(): boolean {
  return getServerConfigError() === null;
}
