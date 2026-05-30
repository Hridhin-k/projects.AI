import { revalidateTag } from 'next/cache';

/** Bust cached user profile data after profile or role changes. */
export function invalidateUserProfile(authUserId: string) {
  revalidateTag(`user-profile-${authUserId}`, { expire: 0 });
  revalidateTag('user-profile', { expire: 0 });
}
