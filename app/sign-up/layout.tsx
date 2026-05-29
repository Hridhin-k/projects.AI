import AuthShell from '@/components/layout/AuthShell';

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
