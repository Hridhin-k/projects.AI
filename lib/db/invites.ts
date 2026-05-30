import { getDb } from './index';
import type { Invite } from './schema';
import type { Invite as DbInvite } from '@/lib/types/database';

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
