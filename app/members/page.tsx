import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import {
  fetchMembers,
  fetchStoredPerformanceMetrics,
  getInvites,
} from "@/lib/db/actions";
import MembersPageClient from "@/components/members/MembersPageClient";

export default async function MembersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  if (user.role === "EMPLOYEE") {
    return (
      <MembersPageClient
        initialMembers={[]}
        initialMetrics={[]}
        initialInvites={[]}
        currentUser={user}
      />
    );
  }

  const [members, metrics, invites] = await Promise.all([
    fetchMembers(),
    fetchStoredPerformanceMetrics(),
    getInvites().catch(() => []),
  ]);

  return (
    <MembersPageClient
      initialMembers={members}
      initialMetrics={metrics}
      initialInvites={invites}
      currentUser={user}
    />
  );
}
