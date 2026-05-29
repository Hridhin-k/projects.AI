"use server";

import { getDb } from './index';
import { requireSuperAdmin } from '@/lib/auth/platform';
import { mapOrganization, type Organization as DbOrganization } from '@/lib/types/database';
import type { Organization } from './schema';

export type PlatformOrganization = Organization & {
  memberCount: number;
  projectCount: number;
};

export async function fetchPlatformOrganizations(): Promise<PlatformOrganization[]> {
  await requireSuperAdmin();
  const db = getDb();

  const { data: orgs, error } = await db
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  const list = (orgs ?? []) as DbOrganization[];

  return Promise.all(
    list.map(async (row) => {
      const org = mapOrganization(row);
      const [{ count: memberCount }, { count: projectCount }] = await Promise.all([
        db
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', row.id),
        db
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', row.id),
      ]);
      return {
        ...org,
        memberCount: memberCount ?? 0,
        projectCount: projectCount ?? 0,
      };
    })
  );
}

export async function setOrganizationActive(
  organizationId: string,
  isActive: boolean
): Promise<void> {
  await requireSuperAdmin();
  const db = getDb();
  const { error } = await db
    .from('organizations')
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', organizationId);
  if (error) throw new Error(error.message);
}

export async function fetchPlatformStats(): Promise<{
  totalOrganizations: number;
  activeOrganizations: number;
  totalUsers: number;
  totalProjects: number;
}> {
  await requireSuperAdmin();
  const db = getDb();

  const [
    { count: totalOrganizations },
    { count: activeOrganizations },
    { count: totalUsers },
    { count: totalProjects },
  ] = await Promise.all([
    db.from('organizations').select('id', { count: 'exact', head: true }),
    db.from('organizations').select('id', { count: 'exact', head: true }).eq('is_active', true),
    db.from('users').select('id', { count: 'exact', head: true }).neq('role', 'SUPER_ADMIN'),
    db.from('projects').select('id', { count: 'exact', head: true }),
  ]);

  return {
    totalOrganizations: totalOrganizations ?? 0,
    activeOrganizations: activeOrganizations ?? 0,
    totalUsers: totalUsers ?? 0,
    totalProjects: totalProjects ?? 0,
  };
}
