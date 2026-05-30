import { unstable_cache } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  mapOrganization,
  mapUser,
  type Organization as DbOrganization,
  type User as DbUser,
} from '@/lib/types/database';
import type { Organization, User } from '@/lib/db/schema';

export type LoadedProfile = {
  user: User;
  organization: Organization | null;
};

async function fetchExistingProfile(authUserId: string): Promise<LoadedProfile | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('users')
    .select('*, organizations (*)')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const orgRow = data.organizations as DbOrganization | DbOrganization[] | null;
  const organizationRow = Array.isArray(orgRow) ? orgRow[0] : orgRow;

  const { organizations: _org, ...userRow } = data;

  return {
    user: mapUser(userRow as DbUser),
    organization: organizationRow ? mapOrganization(organizationRow) : null,
  };
}

/** Cached profile load (user + org in one query). Misses are always re-fetched uncached. */
export async function loadExistingProfile(authUserId: string): Promise<LoadedProfile | null> {
  const cached = unstable_cache(
    async () => fetchExistingProfile(authUserId),
    [`user-profile-${authUserId}`],
    {
      tags: [`user-profile-${authUserId}`, 'user-profile'],
      revalidate: 60,
    }
  );

  const result = await cached();
  if (result) return result;

  return fetchExistingProfile(authUserId);
}
