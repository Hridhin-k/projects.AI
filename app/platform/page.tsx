import PlatformAdminClient from "@/components/platform/PlatformAdminClient";
import { getCurrentUser } from "@/lib/auth/session";
import { isSuperAdmin } from "@/lib/auth/platform";
import {
  fetchPlatformOrganizations,
  fetchPlatformStats,
} from "@/lib/db/platform-actions";
import { redirect } from "next/navigation";

export default async function PlatformAdminPage() {
  const user = await getCurrentUser();
  if (!user || !isSuperAdmin(user)) {
    redirect("/projects");
  }

  const [organizations, stats] = await Promise.all([
    fetchPlatformOrganizations(),
    fetchPlatformStats(),
  ]);

  return (
    <PlatformAdminClient initialOrganizations={organizations} initialStats={stats} />
  );
}
