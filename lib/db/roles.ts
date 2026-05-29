import { getDb } from './index';
import type { UserRole } from '@/lib/db/schema';

export type RoleRecord = {
  id: string;
  slug: UserRole;
  name: string;
  description: string | null;
  scope: 'platform' | 'organization';
  hierarchyLevel: number;
  permissions: Record<string, boolean>;
};

const roleIdCache = new Map<UserRole, string>();

function mapRole(row: {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  scope: string;
  hierarchy_level: number;
  permissions: Record<string, boolean> | null;
}): RoleRecord {
  return {
    id: row.id,
    slug: row.slug as UserRole,
    name: row.name,
    description: row.description,
    scope: row.scope as 'platform' | 'organization',
    hierarchyLevel: row.hierarchy_level,
    permissions: row.permissions ?? {},
  };
}

export async function getRoleIdBySlug(slug: UserRole): Promise<string> {
  const cached = roleIdCache.get(slug);
  if (cached) return cached;

  const db = getDb();
  const { data, error } = await db.from('roles').select('id').eq('slug', slug).single();
  if (error || !data) {
    throw new Error(`Role not found: ${slug}`);
  }

  roleIdCache.set(slug, data.id);
  return data.id;
}

export async function fetchRoles(scope?: 'platform' | 'organization'): Promise<RoleRecord[]> {
  const db = getDb();
  let query = db.from('roles').select('*').order('hierarchy_level', { ascending: false });
  if (scope) query = query.eq('scope', scope);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map(mapRole);
}

export async function fetchOrganizationInviteRoles(): Promise<RoleRecord[]> {
  const roles = await fetchRoles('organization');
  return roles.filter((r) => r.slug !== 'OWNER');
}
