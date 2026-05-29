import AppShell from "@/components/layout/AppShell";
import { getCurrentUser } from "@/lib/auth/session";
import { toShellUser } from "@/lib/auth/shell-user";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return <AppShell user={user ? toShellUser(user) : null}>{children}</AppShell>;
}
