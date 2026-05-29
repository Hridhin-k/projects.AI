import { getDb } from './index';
import type { Invite } from './schema';
import { mapUser, type Invite as DbInvite } from '@/lib/types/database';
import { getRoleIdBySlug } from './roles';

export function generateInviteToken(): string {
  return `inv_${Date.now()}_${Math.random().toString(36).slice(2, 18)}`;
}

function mapInvite(row: DbInvite): Invite {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    organizationId: row.organization_id,
    invitedById: row.invited_by_id,
    token: row.token,
    used: row.used,
    expiresAt: new Date(row.expires_at),
    createdAt: new Date(row.created_at),
  };
}

export async function createInviteRecord(
  organizationId: string,
  email: string,
  role: 'MANAGER' | 'EMPLOYEE',
  invitedById: string
): Promise<Invite> {
  const token = generateInviteToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const roleId = await getRoleIdBySlug(role);

  const { data, error } = await getDb()
    .from('invites')
    .insert({
      organization_id: organizationId,
      email,
      role,
      role_id: roleId,
      token,
      invited_by_id: invitedById,
      expires_at: expiresAt.toISOString(),
      used: false,
    })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message || 'Failed to create invite');
  return mapInvite(data as DbInvite);
}

export async function getInviteByToken(token: string): Promise<Invite | null> {
  const { data, error } = await getDb()
    .from('invites')
    .select('*')
    .eq('token', token)
    .eq('used', false)
    .maybeSingle();

  if (error || !data) return null;
  if (new Date() > new Date(data.expires_at)) return null;
  return mapInvite(data as DbInvite);
}

export async function markInviteAsUsed(token: string): Promise<void> {
  const { error } = await getDb().from('invites').update({ used: true }).eq('token', token);
  if (error) throw new Error(error.message);
}

export async function getInvitesForOrganization(organizationId: string): Promise<Invite[]> {
  const { data, error } = await getDb()
    .from('invites')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map((row) => mapInvite(row as DbInvite));
}
