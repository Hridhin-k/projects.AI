import type { User } from '@/lib/db/schema';

export function getSuperAdminEmails(): string[] {
  const raw = process.env.SUPER_ADMIN_EMAILS || '';
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isSuperAdminEmail(email: string): boolean {
  return getSuperAdminEmails().includes(email.trim().toLowerCase());
}

export function isSuperAdmin(user: Pick<User, 'role'> | null | undefined): boolean {
  return user?.role === 'SUPER_ADMIN';
}

export async function requireSuperAdmin(): Promise<User> {
  const { getCurrentUser } = await import('./session');
  const user = await getCurrentUser();
  if (!user || !isSuperAdmin(user)) {
    throw new Error('Platform admin access required');
  }
  return user;
}
