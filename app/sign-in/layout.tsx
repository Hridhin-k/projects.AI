import AuthShell from '@/components/layout/AuthShell';

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
