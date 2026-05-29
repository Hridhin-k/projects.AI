import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { fetchTasks, fetchMembers } from "@/lib/db/actions";
import { fetchProjects } from "@/lib/db/project-actions";
import DashboardPageClient from "@/components/dashboard/DashboardPageClient";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const [tasks, members, projects] = await Promise.all([
    fetchTasks(),
    fetchMembers(),
    fetchProjects(),
  ]);

  return (
    <DashboardPageClient
      initialTasks={tasks}
      initialMembers={members}
      initialProjects={projects.map((p) => ({ id: p.id, name: p.name }))}
      currentUser={user}
    />
  );
}
