import { getDb } from './index';
import type { Task as DbTask } from '@/lib/types/database';

export type TaskCounts = { total: number; done: number; inProgress: number };
export type MilestoneProgress = { completed: number; total: number };

const EMPTY_TASK_COUNTS: TaskCounts = { total: 0, done: 0, inProgress: 0 };
const EMPTY_MILESTONE_PROGRESS: MilestoneProgress = { completed: 0, total: 0 };

function countTasks(rows: Pick<DbTask, 'status'>[]): TaskCounts {
  let done = 0;
  let inProgress = 0;
  for (const row of rows) {
    if (row.status === 'DONE') done += 1;
    else if (row.status === 'IN_PROGRESS' || row.status === 'BLOCKED') inProgress += 1;
  }
  return { total: rows.length, done, inProgress };
}

function countMilestones(rows: { completed: boolean }[]): MilestoneProgress {
  const completed = rows.filter((row) => row.completed).length;
  return { completed, total: rows.length };
}

/** Batch-fetch task counts and milestone progress for many projects in 2 queries. */
export async function fetchProjectStatsForOrg(
  organizationId: string,
  projectIds: string[]
): Promise<{
  taskCountsByProject: Map<string, TaskCounts>;
  milestoneProgressByProject: Map<string, MilestoneProgress>;
}> {
  const taskCountsByProject = new Map<string, TaskCounts>();
  const milestoneProgressByProject = new Map<string, MilestoneProgress>();

  for (const id of projectIds) {
    taskCountsByProject.set(id, { ...EMPTY_TASK_COUNTS });
    milestoneProgressByProject.set(id, { ...EMPTY_MILESTONE_PROGRESS });
  }

  if (projectIds.length === 0) {
    return { taskCountsByProject, milestoneProgressByProject };
  }

  const db = getDb();
  const [tasksResult, milestonesResult] = await Promise.all([
    db.from('tasks').select('project_id, status').eq('organization_id', organizationId),
    db.from('project_milestones').select('project_id, completed').in('project_id', projectIds),
  ]);

  if (tasksResult.error) throw new Error(tasksResult.error.message);
  if (milestonesResult.error) throw new Error(milestonesResult.error.message);

  const tasksByProject = new Map<string, Pick<DbTask, 'status'>[]>();
  for (const row of tasksResult.data ?? []) {
    const projectId = row.project_id as string;
    if (!tasksByProject.has(projectId)) tasksByProject.set(projectId, []);
    tasksByProject.get(projectId)!.push({ status: row.status as DbTask['status'] });
  }

  for (const [projectId, rows] of tasksByProject) {
    taskCountsByProject.set(projectId, countTasks(rows));
  }

  const milestonesByProject = new Map<string, { completed: boolean }[]>();
  for (const row of milestonesResult.data ?? []) {
    const projectId = row.project_id as string;
    if (!milestonesByProject.has(projectId)) milestonesByProject.set(projectId, []);
    milestonesByProject.get(projectId)!.push({ completed: Boolean(row.completed) });
  }

  for (const [projectId, rows] of milestonesByProject) {
    milestoneProgressByProject.set(projectId, countMilestones(rows));
  }

  return { taskCountsByProject, milestoneProgressByProject };
}

export async function fetchProjectStats(
  projectId: string,
  organizationId: string
): Promise<{ taskCounts: TaskCounts; milestoneProgress: MilestoneProgress }> {
  const { taskCountsByProject, milestoneProgressByProject } = await fetchProjectStatsForOrg(
    organizationId,
    [projectId]
  );
  return {
    taskCounts: taskCountsByProject.get(projectId) ?? EMPTY_TASK_COUNTS,
    milestoneProgress: milestoneProgressByProject.get(projectId) ?? EMPTY_MILESTONE_PROGRESS,
  };
}
