import { notFound } from 'next/navigation';
import { fetchProjectById } from '@/lib/db/project-actions';
import { getCurrentUser } from '@/lib/auth/session';
import { fetchTasks, fetchMembers } from '@/lib/db/actions';
import ProjectDetailClient from '@/components/projects/ProjectDetailClient';

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const [project, currentUser, initialTasks, initialMembers] = await Promise.all([
    fetchProjectById(projectId),
    getCurrentUser(),
    fetchTasks(projectId),
    fetchMembers(),
  ]);

  if (!project) {
    notFound();
  }

  const canManage =
    currentUser &&
    ['ADMIN', 'OWNER', 'MANAGER'].includes(currentUser.role);

  return (
    <ProjectDetailClient
      initialProject={project}
      canManage={!!canManage}
      initialTasks={initialTasks}
      initialMembers={initialMembers.map((m) => ({ id: m.id, name: m.name }))}
    />
  );
}
