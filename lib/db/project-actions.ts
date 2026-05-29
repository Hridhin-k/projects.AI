"use server";

import { cache } from 'react';
import { getDb } from './index';
import { requireAuth, getCurrentUser, requireOrganization } from '@/lib/auth/session';
import type {
  Project,
  ProjectMilestone,
  Deployment,
  ProjectPhase,
  DeploymentEnvironment,
  DeploymentStatus,
  User,
} from './schema';
import {
  mapProject,
  mapTask,
  mapUser,
  type Project as DbProject,
  type Task as DbTask,
  type ProjectMilestone as DbProjectMilestone,
  type Deployment as DbDeployment,
  type User as DbUser,
} from '@/lib/types/database';
import { DEFAULT_MILESTONES } from '@/lib/projects/constants';

function mapMilestone(row: DbProjectMilestone): ProjectMilestone {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    phase: row.phase,
    completed: row.completed,
    sortOrder: row.sort_order,
    completedAt: row.completed_at ? new Date(row.completed_at) : null,
    createdAt: new Date(row.created_at),
  };
}

function mapDeployment(row: DbDeployment): Deployment {
  return {
    id: row.id,
    projectId: row.project_id,
    environment: row.environment,
    version: row.version,
    status: row.status,
    notes: row.notes,
    deployedById: row.deployed_by_id,
    deployedAt: row.deployed_at ? new Date(row.deployed_at) : null,
    createdAt: new Date(row.created_at),
  };
}

const getCachedAuthContext = cache(async () => {
  await requireAuth();
  const org = await requireOrganization();
  const currentUser = await getCurrentUser();
  return { org, currentUser };
});

function canManageProjects(role: User['role']) {
  return role === 'OWNER' || role === 'ADMIN' || role === 'MANAGER';
}

export type ProjectWithStats = Project & {
  taskCounts: { total: number; done: number; inProgress: number };
  milestoneProgress: { completed: number; total: number };
};

async function getProjectTaskCounts(projectId: string, organizationId: string) {
  const db = getDb();
  const { data, error } = await db
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .eq('organization_id', organizationId);

  if (error) throw new Error(error.message);

  const taskRows = (data ?? []) as DbTask[];
  const mappedTasks = taskRows.map(mapTask);

  return {
    total: mappedTasks.length,
    done: mappedTasks.filter((task) => task.status === 'DONE').length,
    inProgress: mappedTasks.filter(
      (task) => task.status === 'IN_PROGRESS' || task.status === 'BLOCKED'
    ).length,
  };
}

async function getMilestoneProgress(projectId: string) {
  const db = getDb();
  const { data, error } = await db
    .from('project_milestones')
    .select('completed')
    .eq('project_id', projectId);

  if (error) throw new Error(error.message);

  const rows = data ?? [];
  return {
    completed: rows.filter((row) => row.completed).length,
    total: rows.length,
  };
}

export const fetchProjects = cache(async (): Promise<ProjectWithStats[]> => {
  const { org } = await getCachedAuthContext();
  const db = getDb();

  const { data, error } = await db
    .from('projects')
    .select('*')
    .eq('organization_id', org.id)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);

  const projectList = ((data ?? []) as DbProject[]).map(mapProject);

  return Promise.all(
    projectList.map(async (project) => ({
      ...project,
      taskCounts: await getProjectTaskCounts(project.id, org.id),
      milestoneProgress: await getMilestoneProgress(project.id),
    }))
  );
});

export const fetchProjectById = cache(async (projectId: string) => {
  const { org } = await getCachedAuthContext();
  const db = getDb();

  const { data: projectRow, error: projectError } = await db
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('organization_id', org.id)
    .maybeSingle();

  if (projectError) throw new Error(projectError.message);
  if (!projectRow) return null;

  const project = mapProject(projectRow as DbProject);

  const [{ data: milestonesData, error: milestonesError }, { data: deploymentsData, error: deploymentsError }] =
    await Promise.all([
      db
        .from('project_milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true }),
      db
        .from('deployments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false }),
    ]);

  if (milestonesError) throw new Error(milestonesError.message);
  if (deploymentsError) throw new Error(deploymentsError.message);

  const milestones = ((milestonesData ?? []) as DbProjectMilestone[]).map(mapMilestone);
  const deploymentRows = (deploymentsData ?? []) as DbDeployment[];
  const deployments = deploymentRows.map(mapDeployment);

  const deployedByIds = Array.from(
    new Set(deploymentRows.map((row) => row.deployed_by_id).filter((id): id is string => Boolean(id)))
  );

  const [createdByResult, deployedByResult, taskCounts, milestoneProgress] = await Promise.all([
    db.from('users').select('*').eq('id', project.createdById).maybeSingle(),
    deployedByIds.length > 0 ? db.from('users').select('*').in('id', deployedByIds) : Promise.resolve({ data: [], error: null }),
    getProjectTaskCounts(project.id, org.id),
    getMilestoneProgress(project.id),
  ]);

  if (createdByResult.error) throw new Error(createdByResult.error.message);
  if (deployedByResult.error) throw new Error(deployedByResult.error.message);

  const createdBy = createdByResult.data ? mapUser(createdByResult.data as DbUser) : null;
  const deployedByUsers = new Map(
    ((deployedByResult.data ?? []) as DbUser[]).map((user) => [user.id, mapUser(user)])
  );

  const deploymentsWithUsers: Array<Deployment & { deployedBy?: User | null }> = deployments.map(
    (deployment) => ({
      ...deployment,
      deployedBy: deployment.deployedById ? deployedByUsers.get(deployment.deployedById) ?? null : null,
    })
  );

  return {
    ...project,
    milestones,
    deployments: deploymentsWithUsers,
    createdBy,
    taskCounts,
    milestoneProgress,
  };
});

export type ProjectDetail = NonNullable<Awaited<ReturnType<typeof fetchProjectById>>>;

export async function createProject(data: {
  name: string;
  description?: string;
  repositoryUrl?: string;
  techStack?: string;
  targetDeployDate?: Date | null;
}): Promise<Project> {
  const { org, currentUser } = await getCachedAuthContext();
  const db = getDb();

  if (!currentUser) throw new Error('User not found');
  if (!canManageProjects(currentUser.role)) {
    throw new Error('You do not have permission to create projects');
  }

  const { data: projectRow, error: projectError } = await db
    .from('projects')
    .insert({
      name: data.name.trim(),
      description: data.description?.trim() || null,
      repository_url: data.repositoryUrl?.trim() || null,
      tech_stack: data.techStack?.trim() || null,
      target_deploy_date: data.targetDeployDate ? data.targetDeployDate.toISOString() : null,
      start_date: new Date().toISOString(),
      organization_id: org.id,
      created_by_id: currentUser.id,
      phase: 'PLANNING',
    })
    .select('*')
    .single();

  if (projectError || !projectRow) {
    throw new Error(projectError?.message || 'Failed to create project');
  }

  const { error: milestonesError } = await db.from('project_milestones').insert(
    DEFAULT_MILESTONES.map((milestone, index) => ({
      project_id: projectRow.id,
      title: milestone.title,
      phase: milestone.phase,
      sort_order: index,
    }))
  );

  if (milestonesError) throw new Error(milestonesError.message);

  return mapProject(projectRow as DbProject);
}

export async function updateProject(
  projectId: string,
  data: Partial<{
    name: string;
    description: string | null;
    phase: ProjectPhase;
    repositoryUrl: string | null;
    deploymentUrl: string | null;
    techStack: string | null;
    targetDeployDate: Date | null;
    deployedAt: Date | null;
  }>
): Promise<Project> {
  const { org, currentUser } = await getCachedAuthContext();
  const db = getDb();

  if (!currentUser) throw new Error('User not found');
  if (!canManageProjects(currentUser.role)) {
    throw new Error('You do not have permission to update projects');
  }

  const { data: existingRow, error: existingError } = await db
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('organization_id', org.id)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);
  if (!existingRow) throw new Error('Project not found');

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.name !== undefined) updates.name = data.name.trim();
  if (data.description !== undefined) updates.description = data.description;
  if (data.phase !== undefined) {
    updates.phase = data.phase;
    if (data.phase === 'DEPLOYED' && !existingRow.deployed_at) {
      updates.deployed_at = new Date().toISOString();
    }
  }
  if (data.repositoryUrl !== undefined) updates.repository_url = data.repositoryUrl;
  if (data.deploymentUrl !== undefined) updates.deployment_url = data.deploymentUrl;
  if (data.techStack !== undefined) updates.tech_stack = data.techStack;
  if (data.targetDeployDate !== undefined) {
    updates.target_deploy_date = data.targetDeployDate ? data.targetDeployDate.toISOString() : null;
  }
  if (data.deployedAt !== undefined) {
    updates.deployed_at = data.deployedAt ? data.deployedAt.toISOString() : null;
  }

  const { data: updatedRow, error: updateError } = await db
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select('*')
    .single();

  if (updateError || !updatedRow) {
    throw new Error(updateError?.message || 'Failed to update project');
  }

  return mapProject(updatedRow as DbProject);
}

export async function deleteProject(projectId: string): Promise<void> {
  const { org, currentUser } = await getCachedAuthContext();
  const db = getDb();

  if (!currentUser) throw new Error('User not found');
  if (!canManageProjects(currentUser.role)) {
    throw new Error('You do not have permission to delete projects');
  }

  const { error } = await db
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('organization_id', org.id);

  if (error) throw new Error(error.message);
}

export async function toggleMilestone(
  milestoneId: string,
  completed: boolean
): Promise<ProjectMilestone> {
  const { org, currentUser } = await getCachedAuthContext();
  const db = getDb();

  if (!currentUser) throw new Error('User not found');

  const { data: milestoneRow, error: milestoneError } = await db
    .from('project_milestones')
    .select('*')
    .eq('id', milestoneId)
    .maybeSingle();

  if (milestoneError) throw new Error(milestoneError.message);
  if (!milestoneRow) throw new Error('Milestone not found');

  const { data: projectRow, error: projectError } = await db
    .from('projects')
    .select('organization_id')
    .eq('id', milestoneRow.project_id)
    .maybeSingle();

  if (projectError) throw new Error(projectError.message);
  if (!projectRow || projectRow.organization_id !== org.id) {
    throw new Error('Milestone not found');
  }

  const { data: updatedRow, error: updateError } = await db
    .from('project_milestones')
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq('id', milestoneId)
    .select('*')
    .single();

  if (updateError || !updatedRow) {
    throw new Error(updateError?.message || 'Failed to update milestone');
  }

  return mapMilestone(updatedRow as DbProjectMilestone);
}

export async function createDeployment(data: {
  projectId: string;
  environment: DeploymentEnvironment;
  version: string;
  notes?: string;
  status?: DeploymentStatus;
}): Promise<Deployment> {
  const { org, currentUser } = await getCachedAuthContext();
  const db = getDb();

  if (!currentUser) throw new Error('User not found');
  if (!canManageProjects(currentUser.role)) {
    throw new Error('You do not have permission to record deployments');
  }

  const { data: projectRow, error: projectError } = await db
    .from('projects')
    .select('*')
    .eq('id', data.projectId)
    .eq('organization_id', org.id)
    .maybeSingle();

  if (projectError) throw new Error(projectError.message);
  if (!projectRow) throw new Error('Project not found');

  const project = mapProject(projectRow as DbProject);
  const status = data.status ?? 'SUCCESS';

  const { data: deploymentRow, error: deploymentError } = await db
    .from('deployments')
    .insert({
      project_id: data.projectId,
      environment: data.environment,
      version: data.version.trim(),
      notes: data.notes?.trim() || null,
      status,
      deployed_by_id: currentUser.id,
      deployed_at: status === 'SUCCESS' ? new Date().toISOString() : null,
    })
    .select('*')
    .single();

  if (deploymentError || !deploymentRow) {
    throw new Error(deploymentError?.message || 'Failed to create deployment');
  }

  if (status === 'SUCCESS' && data.environment === 'PRODUCTION') {
    const { error } = await db
      .from('projects')
      .update({
        phase: 'DEPLOYED',
        deployed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.projectId);
    if (error) throw new Error(error.message);
  } else if (status === 'SUCCESS' && data.environment === 'STAGING') {
    const phaseOrder = ['PLANNING', 'DESIGN', 'DEVELOPMENT', 'TESTING'] as const;
    if (phaseOrder.includes(project.phase as (typeof phaseOrder)[number])) {
      const { error } = await db
        .from('projects')
        .update({
          phase: 'STAGING',
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.projectId);
      if (error) throw new Error(error.message);
    }
  }

  return mapDeployment(deploymentRow as DbDeployment);
}

export async function advanceProjectPhase(projectId: string): Promise<Project> {
  const { org } = await getCachedAuthContext();
  const db = getDb();

  const { data: projectRow, error } = await db
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('organization_id', org.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!projectRow) throw new Error('Project not found');

  const project = mapProject(projectRow as DbProject);
  const phases: ProjectPhase[] = [
    'PLANNING',
    'DESIGN',
    'DEVELOPMENT',
    'TESTING',
    'STAGING',
    'DEPLOYMENT',
    'DEPLOYED',
    'MAINTENANCE',
    'ARCHIVED',
  ];
  const idx = phases.indexOf(project.phase);
  const nextPhase = idx < phases.length - 1 ? phases[idx + 1] : project.phase;

  return updateProject(projectId, { phase: nextPhase });
}
