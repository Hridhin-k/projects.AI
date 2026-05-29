import AuthShell from '@/components/layout/AuthShell';

export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
