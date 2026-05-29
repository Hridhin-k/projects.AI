import { createAdminClient } from '@/lib/supabase/admin';
import { isSuperAdminEmail } from '@/lib/auth/platform';
import {
  mapOrganization,
  mapUser,
  type User as DbUser,
  type Organization as DbOrganization,
} from '@/lib/types/database';
import type { Organization, User } from '@/lib/db/schema';
import { getRoleIdBySlug } from '@/lib/db/roles';

export type ProvisionOptions = {
  organizationName?: string;
};

export async function provisionUserProfile(
  authUserId: string,
  email: string,
  name: string,
  options: ProvisionOptions = {}
): Promise<{ user: User; organization: Organization | null }> {
  const admin = createAdminClient();
  const normalizedEmail = email.trim().toLowerCase();

  const { data: existing } = await admin
    .from('users')
    .select('*')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (existing) {
    if (existing.organization_id) {
      const organization = await fetchOrg(admin, existing.organization_id);
      if (!organization.isActive && existing.role !== 'SUPER_ADMIN') {
        throw new Error('ORG_SUSPENDED');
      }
      return { user: mapUser(existing as DbUser), organization };
    }
    return { user: mapUser(existing as DbUser), organization: null };
  }

  const { data: pendingInvite } = await admin
    .from('invites')
    .select('id')
    .ilike('email', normalizedEmail)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (pendingInvite) {
    throw new Error('INVITE_PENDING');
  }

  if (isSuperAdminEmail(normalizedEmail)) {
    const superAdminRoleId = await getRoleIdBySlug('SUPER_ADMIN');
    const { data: superUser, error: superError } = await admin
      .from('users')
      .insert({
        auth_user_id: authUserId,
        name,
        email: normalizedEmail,
        organization_id: null,
        role_id: superAdminRoleId,
        role: 'SUPER_ADMIN',
        tasks_count: 0,
      })
      .select()
      .single();

    if (superError || !superUser) {
      throw new Error(superError?.message || 'Failed to create platform admin');
    }

    return { user: mapUser(superUser as DbUser), organization: null };
  }

  const orgName = options.organizationName?.trim();
  if (!orgName) {
    throw new Error('ORG_NAME_REQUIRED');
  }

  const trialStart = new Date();
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 20);

  const { data: org, error: orgError } = await admin
    .from('organizations')
    .insert({
      name: orgName,
      subscription_status: 'TRIAL',
      trial_start_date: trialStart.toISOString(),
      trial_end_date: trialEnd.toISOString(),
      plan: 'FREE_TRIAL',
      is_active: true,
    })
    .select()
    .single();

  if (orgError || !org) {
    throw new Error(orgError?.message || 'Failed to create organization');
  }

  const ownerRoleId = await getRoleIdBySlug('OWNER');
  const { data: newUser, error: userError } = await admin
    .from('users')
    .insert({
      auth_user_id: authUserId,
      name,
      email: normalizedEmail,
      organization_id: org.id,
      role_id: ownerRoleId,
      role: 'OWNER',
      tasks_count: 0,
    })
    .select()
    .single();

  if (userError || !newUser) {
    throw new Error(userError?.message || 'Failed to create user profile');
  }

  return {
    user: mapUser(newUser as DbUser),
    organization: mapOrganization(org as DbOrganization),
  };
}

async function fetchOrg(
  admin: ReturnType<typeof createAdminClient>,
  orgId: string
): Promise<Organization> {
  const { data, error } = await admin.from('organizations').select('*').eq('id', orgId).single();
  if (error || !data) throw new Error('Organization not found');
  return mapOrganization(data as DbOrganization);
}
