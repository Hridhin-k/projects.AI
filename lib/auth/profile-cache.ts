import { revalidateTag } from 'next/cache';
import { provisionUserProfile } from '@/lib/auth/provision';
import type { Organization, User } from '@/lib/db/schema';

export const USER_PROFILE_CACHE_TAG = 'user-profile';

/** Load user profile from DB. Called once per request via React cache() in session.ts. */
export async function loadUserProfile(
  authUserId: string,
  email: string,
  name: string
): Promise<{ user: User; organization: Organization | null }> {
  return provisionUserProfile(authUserId, email, name);
}

export function invalidateUserProfile(authUserId: string) {
  revalidateTag(`user-profile-${authUserId}`, { expire: 0 });
  revalidateTag(USER_PROFILE_CACHE_TAG, { expire: 0 });
}
