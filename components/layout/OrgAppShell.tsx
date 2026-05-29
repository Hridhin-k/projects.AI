import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getCurrentUser } from '@/lib/auth/session';
import { isSuperAdmin } from '@/lib/auth/platform';
import { toShellUser } from '@/lib/auth/shell-user';
import { getTrialStatus } from '@/lib/db/actions';

async function TrialBanner() {
  try {
    const trialStatus = await getTrialStatus();
    if (!trialStatus.isActive) return null;
    return (
      <div className="bg-gradient-to-r from-purple-700/20 to-teal-700/20 border-b border-purple-700/30 py-2 sm:py-3 shrink-0">
        <div className="container mx-auto px-3 sm:px-4 text-center text-xs sm:text-sm text-gray-200">
          20-day Free Trial: Active ({trialStatus.daysRemaining} days remaining)
        </div>
      </div>
    );
  } catch {
    return null;
  }
}

export default async function OrgAppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user && isSuperAdmin(user)) {
    redirect('/platform');
  }

  const shellUser = user ? toShellUser(user) : null;

  return (
    <div className="min-h-dvh flex flex-col bg-[#171725] text-gray-100">
      <Header
        userName={shellUser?.name}
        userEmail={shellUser?.email}
        userRole={user?.role}
        organizationName={user?.organization?.name}
      />
      <Suspense fallback={null}>
        <TrialBanner />
      </Suspense>
      <main className="flex-1 w-full">{children}</main>
      <Footer />
    </div>
  );
}
