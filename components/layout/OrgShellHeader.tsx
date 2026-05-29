import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getTrialStatus } from '@/lib/db/actions';
import { getCurrentUser, getCurrentOrganization } from '@/lib/auth/session';
import { isSuperAdmin } from '@/lib/auth/platform';
import { redirect } from 'next/navigation';
import { toShellUser } from '@/lib/auth/shell-user';

export default async function OrgShellHeader() {
  const user = await getCurrentUser();
  if (user && isSuperAdmin(user)) {
    redirect('/platform');
  }
  const org = await getCurrentOrganization();

  let trialStatus: Awaited<ReturnType<typeof getTrialStatus>> | null = null;
  try {
    trialStatus = await getTrialStatus();
  } catch {
    trialStatus = null;
  }

  const shellUser = user ? toShellUser(user) : null;

  return (
    <>
      <Header
        userName={shellUser?.name}
        userEmail={shellUser?.email}
        userRole={user?.role}
        organizationName={org?.name}
      />

      {trialStatus?.isActive && (
        <div className="bg-gradient-to-r from-purple-700/20 to-teal-700/20 border-b border-purple-700/30 py-2 sm:py-3 shrink-0">
          <div className="container mx-auto px-3 sm:px-4 text-center text-xs sm:text-sm text-gray-200">
            20-day Free Trial: Active ({trialStatus.daysRemaining} days remaining)
          </div>
        </div>
      )}
    </>
  );
}
