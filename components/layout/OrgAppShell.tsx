import { redirect } from 'next/navigation';
import { getCurrentUser, getCurrentOrganization } from '@/lib/auth/session';
import { isSuperAdmin } from '@/lib/auth/platform';
import { toShellUser } from '@/lib/auth/shell-user';
import AppShell from '@/components/layout/AppShell';

export default async function OrgAppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user && isSuperAdmin(user)) {
    redirect('/platform');
  }
  const org = await getCurrentOrganization();

  return (
    <AppShell
      user={user ? toShellUser(user) : null}
      organizationName={org?.name}
    >
      {children}
    </AppShell>
  );
}
