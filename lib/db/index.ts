import { createAdminClient } from '@/lib/supabase/admin';

/** Server-side database access via Supabase service role (scoped in application code). */
export function getDb() {
  return createAdminClient();
}
