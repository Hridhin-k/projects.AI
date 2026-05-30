import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { provisionUserProfile } from '@/lib/auth/provision';
import { isSuperAdmin } from '@/lib/auth/platform';
import type { Organization, User } from '@/lib/db/schema';

export type CurrentUser = User & { organization: Organization | null };

export async function requireOrgMember(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  if (isSuperAdmin(user)) throw new Error('Organization access required');
  if (!user.organization) throw new Error('No organization found');
  if (user.organization.isActive === false) throw new Error('Organization suspended');
  return user;
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const name =
    (authUser.user_metadata?.full_name as string) ||
    (authUser.user_metadata?.name as string) ||
    authUser.email?.split('@')[0] ||
    'User';
  const email = authUser.email || '';

  try {
    const { user, organization } = await provisionUserProfile(authUser.id, email, name);
    return { ...user, organization };
  } catch (e) {
    if (e instanceof Error && e.message === 'INVITE_PENDING') {
      return null;
    }
    throw e;
  }
});

export async function getCurrentOrganization(): Promise<Organization | null> {
  const user = await getCurrentUser();
  return user?.organization ?? null;
}

export async function requireAuth(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  return user.authUserId;
}

export async function requireOrganization(): Promise<Organization> {
  const user = await requireOrgMember();
  return user.organization!;
}
