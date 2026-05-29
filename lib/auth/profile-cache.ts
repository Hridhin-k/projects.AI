import { unstable_cache, revalidateTag } from 'next/cache';
import { provisionUserProfile } from '@/lib/auth/provision';
import type { Organization, User } from '@/lib/db/schema';

export const USER_PROFILE_CACHE_TAG = 'user-profile';

export async function getCachedUserProfile(
  authUserId: string,
  email: string,
  name: string
): Promise<{ user: User; organization: Organization | null }> {
  return unstable_cache(
    () => provisionUserProfile(authUserId, email, name),
    ['user-profile', authUserId],
    { revalidate: 60, tags: [USER_PROFILE_CACHE_TAG, `user-profile-${authUserId}`] }
  )();
}

export function invalidateUserProfile(authUserId: string) {
  revalidateTag(`user-profile-${authUserId}`, { expire: 0 });
  revalidateTag(USER_PROFILE_CACHE_TAG, { expire: 0 });
}
