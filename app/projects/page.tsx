import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { fetchProjects } from "@/lib/db/project-actions";
import ProjectsPageClient from "@/components/projects/ProjectsPageClient";

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.organization) redirect("/sign-in?error=setup");

  const projects = await fetchProjects();

  return <ProjectsPageClient initialProjects={projects} userRole={user.role} />;
}
