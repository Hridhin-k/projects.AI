import { Suspense } from 'react';
import OrgShellHeader from '@/components/layout/OrgShellHeader';
import OrgShellHeaderFallback from '@/components/layout/OrgShellHeaderFallback';
import Footer from '@/components/layout/Footer';

export default function OrgAppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col bg-[#171725] text-gray-100">
      <Suspense fallback={<OrgShellHeaderFallback />}>
        <OrgShellHeader />
      </Suspense>
      <main className="flex-1 w-full">{children}</main>
      <Footer />
    </div>
  );
}
