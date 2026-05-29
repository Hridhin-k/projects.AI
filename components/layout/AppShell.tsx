import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getTrialStatus } from '@/lib/db/actions';
import type { ShellUser } from '@/lib/auth/shell-user';

interface AppShellProps {
  children: React.ReactNode;
  user?: ShellUser | null;
  organizationName?: string;
}

export default async function AppShell({
  children,
  user,
  organizationName,
}: AppShellProps) {
  let trialStatus: Awaited<ReturnType<typeof getTrialStatus>> | null = null;
  try {
    trialStatus = await getTrialStatus();
  } catch {
    trialStatus = null;
  }

  return (
    <div className="min-h-dvh flex flex-col bg-[#171725] text-gray-100">
      <Header
        userName={user?.name}
        userEmail={user?.email}
        userRole={user?.role}
        organizationName={organizationName}
      />

      {trialStatus?.isActive && (
        <div className="bg-gradient-to-r from-purple-700/20 to-teal-700/20 border-b border-purple-700/30 py-2 sm:py-3 shrink-0">
          <div className="container mx-auto px-3 sm:px-4 text-center text-xs sm:text-sm text-gray-200">
            20-day Free Trial: Active ({trialStatus.daysRemaining} days remaining)
          </div>
        </div>
      )}

      <main className="flex-1 w-full">{children}</main>
      <Footer />
    </div>
  );
}
