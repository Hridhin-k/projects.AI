"use server";

import { cache } from 'react';
import { getDb } from './index';
import { requireAuth, getCurrentUser, requireOrganization } from '@/lib/auth/session';
import { invalidateUserProfile } from '@/lib/auth/profile-cache';
import { sendTaskAssignmentEmail, sendWelcomeEmail, sendInviteEmail, sendTaskProgressEmail } from '@/lib/email/resend';
import { runInBackground } from '@/lib/async/run-in-background';
import { runWithConcurrency } from '@/lib/async/concurrency';
import { PERFORMANCE_EVAL_CONCURRENCY } from '@/lib/ai/constants';
import { generateInviteToken } from './invites';
import { getRoleIdBySlug } from './roles';
import {
  canCreateTasks,
  canEditTask,
  canDeleteTask,
  canReassignTasks,
  canChangeTaskStatus,
  canCommentOnTask,
  canManageTeamMembers,
} from '@/lib/auth/permissions';
import type { UserRole } from '@/lib/db/schema';
import type { PerformanceMetric, Task, TaskComment, User } from './schema';
import {
  mapOrganization,
  mapTask,
  mapUser,
  type Invite as DbInvite,
  type Organization as DbOrganization,
  type PerformanceMetric as DbPerformanceMetric,
  type Task as DbTask,
  type TaskComment as DbTaskComment,
  type User as DbUser,
} from '@/lib/types/database';

function mapPerformanceMetric(row: DbPerformanceMetric): PerformanceMetric {
  return {
    id: row.id,
    userId: row.user_id,
    organizationId: row.organization_id,
    completionRate: row.completion_rate,
    averageTimeDays: row.average_time_days,
    tasksCompleted: row.tasks_completed,
    tasksInProgress: row.tasks_in_progress,
    tasksOverdue: row.tasks_overdue,
    lastAIEvaluation: row.last_ai_evaluation,
    evaluationDate: row.evaluation_date ? new Date(row.evaluation_date) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapInvite(row: DbInvite) {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    organizationId: row.organization_id,
    invitedById: row.invited_by_id,
    token: row.token,
    used: row.used,
    expiresAt: new Date(row.expires_at),
    createdAt: new Date(row.created_at),
  };
}

function mapTaskComment(row: DbTaskComment): TaskComment {
  return {
    id: row.id,
    taskId: row.task_id,
    userId: row.user_id,
    content: row.content,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// Cache auth context to avoid redundant calls
const getCachedAuthContext = cache(async () => {
  await requireAuth();
  const org = await requireOrganization();
  const currentUser = await getCurrentUser();
  return { org, currentUser };
});

// Helper to recalculate tasksCount for a user
async function recalculateTasksCount(userId: string, organizationId: string): Promise<void> {
  const db = getDb();
  const { count, error: countError } = await db
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('assignee_id', userId)
    .eq('organization_id', organizationId)
    .in('status', ['TO_DO', 'IN_PROGRESS', 'BLOCKED']);

  if (countError) throw new Error(countError.message);

  const { error: updateError } = await db
    .from('users')
    .update({
      tasks_count: count ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (updateError) throw new Error(updateError.message);
}

const TASK_LIST_COLUMNS =
  'id, title, description, assignee_id, status, due_date, priority, project_id, organization_id, created_by_id, created_at, updated_at';

// Fetch tasks for current organization (role-based filtering pushed to SQL)
export const fetchTasks = cache(async (projectId?: string): Promise<Task[]> => {
  const { org, currentUser } = await getCachedAuthContext();
  if (!currentUser) throw new Error('User not found');

  const db = getDb();

  if (currentUser.role === 'EMPLOYEE') {
    let query = db
      .from('tasks')
      .select(TASK_LIST_COLUMNS)
      .eq('organization_id', org.id)
      .eq('assignee_id', currentUser.id)
      .order('created_at', { ascending: false });
    if (projectId) query = query.eq('project_id', projectId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return ((data ?? []) as DbTask[]).map(mapTask);
  }

  if (currentUser.role === 'MANAGER') {
    const { data: employeeRows, error: employeesError } = await db
      .from('users')
      .select('id')
      .eq('organization_id', org.id)
      .eq('role', 'EMPLOYEE');
    if (employeesError) throw new Error(employeesError.message);

    const allowedAssigneeIds = [
      ...(employeeRows ?? []).map((employee) => employee.id),
      currentUser.id,
    ];

    const orFilters = [
      'assignee_id.is.null',
      `created_by_id.eq.${currentUser.id}`,
      `assignee_id.in.(${allowedAssigneeIds.join(',')})`,
    ];

    let query = db
      .from('tasks')
      .select(TASK_LIST_COLUMNS)
      .eq('organization_id', org.id)
      .or(orFilters.join(','))
      .order('created_at', { ascending: false });
    if (projectId) query = query.eq('project_id', projectId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return ((data ?? []) as DbTask[]).map(mapTask);
  }

  if (currentUser.role === 'ADMIN' || currentUser.role === 'OWNER') {
    let query = db
      .from('tasks')
      .select(TASK_LIST_COLUMNS)
      .eq('organization_id', org.id)
      .order('created_at', { ascending: false });
    if (projectId) query = query.eq('project_id', projectId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return ((data ?? []) as DbTask[]).map(mapTask);
  }

  return [];
});

// Fetch all members for current organization (with role-based filtering)
export const fetchMembers = cache(async (): Promise<User[]> => {
  const { org, currentUser } = await getCachedAuthContext();
  if (!currentUser) throw new Error('User not found');

  const db = getDb();

  if (currentUser.role === 'ADMIN' || currentUser.role === 'OWNER') {
    const { data, error } = await db
      .from('users')
      .select('*')
      .eq('organization_id', org.id)
      .order('name', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => mapUser(row as DbUser));
  }

  if (currentUser.role === 'MANAGER') {
    const { data, error } = await db
      .from('users')
      .select('*')
      .eq('organization_id', org.id)
      .eq('role', 'EMPLOYEE')
      .order('name', { ascending: true });
    if (error) throw new Error(error.message);

    const membersOnly = (data ?? []).map((row) => mapUser(row as DbUser));
    if (!membersOnly.some((member) => member.id === currentUser.id)) {
      membersOnly.push(currentUser);
    }
    return membersOnly;
  }

  if (currentUser.role === 'EMPLOYEE') {
    return [currentUser];
  }

  return [];
});

// Calculate and create/update performance metrics for a user
async function calculatePerformanceMetrics(
  userId: string,
  organizationId: string,
  useAI: boolean = true
): Promise<PerformanceMetric> {
  const db = getDb();
  const { data: taskRows, error: tasksError } = await db
    .from('tasks')
    .select('*')
    .eq('assignee_id', userId)
    .eq('organization_id', organizationId);
  if (tasksError) throw new Error(tasksError.message);

  const userTasks = (taskRows ?? []) as DbTask[];
  const totalTasks = userTasks.length;
  const completedTasks = userTasks.filter((task) => task.status === 'DONE').length;
  const inProgressTasks = userTasks.filter((task) => task.status === 'IN_PROGRESS').length;
  const blockedTasks = userTasks.filter((task) => task.status === 'BLOCKED').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const completedTasksWithDates = userTasks.filter(
    (task) => task.status === 'DONE' && task.created_at && task.updated_at
  );

  let averageTimeDays = 0;
  if (completedTasksWithDates.length > 0) {
    const totalDays = completedTasksWithDates.reduce((sum, task) => {
      const created = new Date(task.created_at);
      const updated = new Date(task.updated_at);
      const days = Math.ceil((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      return sum + (days > 0 ? days : 1);
    }, 0);
    averageTimeDays = Math.round(totalDays / completedTasksWithDates.length);
  }

  const now = new Date();
  let tasksOverdue = 0;
  for (const task of userTasks) {
    if (task.status === 'DONE' || !task.due_date) continue;
    const dueDateText = task.due_date.toLowerCase();
    if (dueDateText.match(/\d{4}-\d{2}-\d{2}/)) {
      const dueDate = new Date(task.due_date);
      if (dueDate < now) tasksOverdue += 1;
    }
  }

  const { data: userInfo, error: userError } = await db.from('users').select('*').eq('id', userId).maybeSingle();
  if (userError) throw new Error(userError.message);

  const userName = userInfo?.name || 'User';
  let aiEvaluation = '';

  if (useAI && process.env.GEMINI_API_KEY) {
    try {
      aiEvaluation = await generateAIPerformanceEvaluation({
        userName,
        totalTasks,
        completedTasks,
        inProgressTasks,
        blockedTasks,
        completionRate,
        averageTimeDays,
        tasksOverdue,
        tasks: userTasks.map((task) => ({
          title: task.title,
          status: task.status,
          priority: task.priority || 'MEDIUM',
          dueDate: task.due_date,
          createdAt: task.created_at ? new Date(task.created_at).toISOString() : undefined,
          updatedAt: task.updated_at ? new Date(task.updated_at).toISOString() : undefined,
        })),
      });
    } catch (error) {
      console.error('Error generating AI evaluation:', error);
      aiEvaluation = generateBasicEvaluation(completionRate, averageTimeDays, completedTasks, tasksOverdue);
    }
  } else {
    aiEvaluation = generateBasicEvaluation(completionRate, averageTimeDays, completedTasks, tasksOverdue);
  }

  const { data: existingMetric, error: metricError } = await db
    .from('performance_metrics')
    .select('*')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .maybeSingle();
  if (metricError) throw new Error(metricError.message);

  const metricData = {
    user_id: userId,
    organization_id: organizationId,
    completion_rate: completionRate,
    average_time_days: averageTimeDays,
    tasks_completed: completedTasks,
    tasks_in_progress: inProgressTasks,
    tasks_overdue: tasksOverdue,
    last_ai_evaluation: aiEvaluation,
    evaluation_date: new Date().toISOString(),
  };

  if (existingMetric) {
    const { data: updated, error: updateError } = await db
      .from('performance_metrics')
      .update({
        ...metricData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingMetric.id)
      .select()
      .single();
    if (updateError || !updated) throw new Error(updateError?.message || 'Failed to update performance metric');
    return mapPerformanceMetric(updated as DbPerformanceMetric);
  }

  const { data: created, error: createError } = await db
    .from('performance_metrics')
    .insert(metricData)
    .select()
    .single();
  if (createError || !created) throw new Error(createError?.message || 'Failed to create performance metric');
  return mapPerformanceMetric(created as DbPerformanceMetric);
}

function schedulePerformanceMetricsUpdate(userId: string, organizationId: string): void {
  runInBackground(`performance-metrics:${userId}`, async () => {
    await calculatePerformanceMetrics(userId, organizationId, false);
  });
}

// Generate AI-powered performance evaluation using Gemini
async function generateAIPerformanceEvaluation(data: {
  userName: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  completionRate: number;
  averageTimeDays: number;
  tasksOverdue: number;
  tasks: Array<{
    title: string;
    status: string;
    priority: string;
    dueDate: string;
    createdAt?: string;
    updatedAt?: string;
  }>;
}): Promise<string> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');

  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const { GEMINI_MODEL } = await import('@/lib/ai/constants');
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const prompt = `You are the AI Performance Analyst for Projects.AI. Analyze the following performance data for ${data.userName} and provide a comprehensive, professional evaluation.

Performance Metrics:
- Total Tasks Assigned: ${data.totalTasks}
- Tasks Completed: ${data.completedTasks}
- Tasks In Progress: ${data.inProgressTasks}
- Tasks Blocked: ${data.blockedTasks}
- Completion Rate: ${data.completionRate}%
- Average Completion Time: ${data.averageTimeDays} days
- Overdue Tasks: ${data.tasksOverdue}

Recent Task Activity:
${data.tasks
  .slice(0, 10)
  .map((task, index) => `${index + 1}. "${task.title}" - Status: ${task.status}, Priority: ${task.priority}, Due: ${task.dueDate}`)
  .join('\n')}

Provide a detailed performance evaluation (2-3 paragraphs) that includes:
1. Overall performance assessment
2. Strengths and areas of excellence
3. Areas for improvement and specific recommendations
4. Workload analysis and capacity assessment
5. Suggestions for task assignment optimization

Be professional, constructive, and data-driven. Focus on actionable insights.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

// Fallback basic evaluation function
function generateBasicEvaluation(
  completionRate: number,
  avgTime: number,
  tasksCompleted: number,
  tasksOverdue: number
): string {
  let evaluation = '';

  if (completionRate >= 90) {
    evaluation = `Excellent performance! ${completionRate}% completion rate demonstrates strong reliability and commitment. `;
  } else if (completionRate >= 75) {
    evaluation = `Strong performance with a ${completionRate}% completion rate. `;
  } else if (completionRate >= 60) {
    evaluation = `Good performance with room for improvement. Current completion rate is ${completionRate}%. `;
  } else {
    evaluation = `Performance needs attention. Completion rate of ${completionRate}% indicates challenges that should be addressed. `;
  }

  if (avgTime <= 5) {
    evaluation += `Tasks are completed efficiently with an average time of ${avgTime} days. `;
  } else if (avgTime <= 10) {
    evaluation += `Task completion time is reasonable at ${avgTime} days on average. `;
  } else {
    evaluation += `Task completion time could be improved (currently ${avgTime} days average). `;
  }

  if (tasksOverdue > 0) {
    evaluation += `Attention needed: ${tasksOverdue} task(s) are currently overdue. `;
  }

  evaluation += `Has successfully completed ${tasksCompleted} tasks. `;

  if (completionRate >= 85 && avgTime <= 7 && tasksOverdue === 0) {
    evaluation += 'Recommended for high-priority and complex assignments.';
  } else if (completionRate >= 70) {
    evaluation += 'Suitable for standard task assignments.';
  } else {
    evaluation += 'Consider providing additional support and resources.';
  }

  return evaluation;
}

// Fetch performance metrics for current organization
export async function fetchPerformanceMetrics(forceRecalculate: boolean = false): Promise<PerformanceMetric[]> {
  const { org } = await getCachedAuthContext();
  const db = getDb();

  const { data: orgUsers, error: usersError } = await db.from('users').select('*').eq('organization_id', org.id);
  if (usersError) throw new Error(usersError.message);

  const { data: existingMetrics, error: metricsError } = await db
    .from('performance_metrics')
    .select('*')
    .eq('organization_id', org.id);
  if (metricsError) throw new Error(metricsError.message);

  const metricsMap = new Map((existingMetrics ?? []).map((metric) => [metric.user_id, metric as DbPerformanceMetric]));
  const usersToEvaluate = (orgUsers ?? []).filter((user) => {
    const existingMetric = metricsMap.get(user.id);
    return (
      forceRecalculate ||
      !existingMetric ||
      !existingMetric.evaluation_date ||
      new Date().getTime() - new Date(existingMetric.evaluation_date).getTime() > 24 * 60 * 60 * 1000
    );
  });

  await runWithConcurrency(
    usersToEvaluate,
    PERFORMANCE_EVAL_CONCURRENCY,
    (user) => calculatePerformanceMetrics(user.id, org.id, true).then(() => undefined),
    (user, error) =>
      `Failed to evaluate ${user.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
  );

  const { data: latestMetrics, error: latestError } = await db
    .from('performance_metrics')
    .select('*')
    .eq('organization_id', org.id);
  if (latestError) throw new Error(latestError.message);

  return (latestMetrics ?? []).map((metric) => mapPerformanceMetric(metric as DbPerformanceMetric));
}

/** Read stored metrics only — no AI recalculation (fast SSR / initial page load) */
export const fetchStoredPerformanceMetrics = cache(async (): Promise<PerformanceMetric[]> => {
  const { org } = await getCachedAuthContext();
  const db = getDb();
  const { data, error } = await db
    .from('performance_metrics')
    .select('*')
    .eq('organization_id', org.id);
  if (error) throw new Error(error.message);
  return (data ?? []).map((metric) => mapPerformanceMetric(metric as DbPerformanceMetric));
});

// Monitor all members' performance (triggers AI evaluation for all)
export async function monitorAllMembersPerformance(): Promise<{ success: boolean; evaluated: number; errors: string[] }> {
  await requireAuth();
  const org = await requireOrganization();
  const currentUser = await getCurrentUser();

  if (!currentUser || !['ADMIN', 'OWNER', 'MANAGER'].includes(currentUser.role)) {
    throw new Error('You do not have permission to monitor performance');
  }

  const db = getDb();
  const { data: orgUsers, error: usersError } = await db.from('users').select('*').eq('organization_id', org.id);
  if (usersError) throw new Error(usersError.message);

  const errors: string[] = [];
  const { succeeded: evaluated, errors: evalErrors } = await runWithConcurrency(
    orgUsers ?? [],
    PERFORMANCE_EVAL_CONCURRENCY,
    (user) => calculatePerformanceMetrics(user.id, org.id, true).then(() => undefined),
    (user, error) => {
      const errorMessage = `Failed to evaluate ${user.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMessage, error);
      return errorMessage;
    }
  );
  errors.push(...evalErrors);

  return {
    success: errors.length === 0,
    evaluated,
    errors,
  };
}

// Create a new task
export async function createTask(taskData: {
  title: string;
  description: string;
  assigneeId: string | null;
  dueDate: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  projectId: string;
}): Promise<Task> {
  await requireAuth();
  const org = await requireOrganization();
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('User not found');

  if (!(await canCreateTasks())) {
    throw new Error('You do not have permission to create tasks');
  }

  if (!taskData.projectId?.trim()) {
    throw new Error('Every task must be linked to a project');
  }

  const db = getDb();

  if (currentUser.role === 'MANAGER' && taskData.assigneeId) {
    const { data: assignee, error } = await db.from('users').select('*').eq('id', taskData.assigneeId).maybeSingle();
    if (error) throw new Error(error.message);
    if (assignee && assignee.role !== 'EMPLOYEE' && taskData.assigneeId !== currentUser.id) {
      throw new Error('Managers can only assign tasks to members (employees) or themselves');
    }
  }

  const { data: project, error: projectError } = await db
    .from('projects')
    .select('id')
    .eq('id', taskData.projectId)
    .eq('organization_id', org.id)
    .maybeSingle();
  if (projectError) throw new Error(projectError.message);
  if (!project) throw new Error('Project not found');

  const { data: newTask, error: createError } = await db
    .from('tasks')
    .insert({
      title: taskData.title,
      description: taskData.description,
      assignee_id: taskData.assigneeId ?? null,
      due_date: taskData.dueDate,
      priority: taskData.priority || 'MEDIUM',
      status: 'TO_DO',
      project_id: taskData.projectId,
      organization_id: org.id,
      created_by_id: currentUser.id,
    })
    .select()
    .single();
  if (createError || !newTask) throw new Error(createError?.message || 'Failed to create task');

  if (taskData.assigneeId) {
    await recalculateTasksCount(taskData.assigneeId, org.id);
    const { data: assignee, error } = await db.from('users').select('*').eq('id', taskData.assigneeId).maybeSingle();
    if (error) throw new Error(error.message);

    if (assignee) {
      runInBackground('task-assignment-email', async () => {
        await sendTaskAssignmentEmail({
          to: assignee.email,
          toName: assignee.name,
          taskTitle: taskData.title,
          taskDescription: taskData.description || '',
          dueDate: taskData.dueDate,
          assignerName: currentUser.name,
          assignerEmail: currentUser.email,
          priority: taskData.priority || 'MEDIUM',
          status: 'TO_DO',
        });
      });
    }
  }

  return mapTask(newTask as DbTask);
}

// Update an existing task
export async function updateTaskAction(
  taskId: string,
  changes: Partial<
    Pick<Task, 'title' | 'description' | 'assigneeId' | 'status' | 'dueDate' | 'priority' | 'projectId'>
  >
): Promise<Task> {
  await requireAuth();
  const org = await requireOrganization();
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('User not found');

  const db = getDb();

  const { data: currentTask, error: currentTaskError } = await db
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .eq('organization_id', org.id)
    .maybeSingle();
  if (currentTaskError) throw new Error(currentTaskError.message);
  if (!currentTask) throw new Error(`Task with id ${taskId} not found`);

  const hasStatusChange = changes.status !== undefined;
  const hasAssigneeChange = Object.prototype.hasOwnProperty.call(changes, 'assigneeId');
  const hasEditableFieldChange =
    changes.title !== undefined ||
    changes.description !== undefined ||
    changes.priority !== undefined ||
    changes.dueDate !== undefined;

  if (hasStatusChange && !(await canChangeTaskStatus(currentTask.assignee_id || null))) {
    throw new Error('You do not have permission to change task status');
  }

  if (hasAssigneeChange) {
    if (!(await canReassignTasks())) {
      throw new Error('You do not have permission to reassign tasks');
    }

    if (currentUser.role === 'MANAGER' && changes.assigneeId) {
      const { data: newAssignee, error } = await db.from('users').select('*').eq('id', changes.assigneeId).maybeSingle();
      if (error) throw new Error(error.message);
      if (newAssignee && newAssignee.role !== 'EMPLOYEE' && changes.assigneeId !== currentUser.id) {
        throw new Error('Managers can only reassign tasks to members (employees) or themselves');
      }
    }
  }

  if (hasEditableFieldChange || changes.projectId !== undefined) {
    if (currentUser.role === 'EMPLOYEE') {
      throw new Error('You can only update the status of your tasks');
    }

    if (!(await canEditTask(currentTask.assignee_id || null, currentTask.created_by_id))) {
      throw new Error('You do not have permission to edit this task');
    }

    if (currentUser.role === 'MANAGER' && currentTask.assignee_id) {
      const { data: assignee, error } = await db.from('users').select('*').eq('id', currentTask.assignee_id).maybeSingle();
      if (error) throw new Error(error.message);
      if (assignee && assignee.role !== 'EMPLOYEE' && currentTask.created_by_id !== currentUser.id) {
        throw new Error('Managers can only edit tasks assigned to members or tasks they created');
      }
    }
  }

  if (changes.projectId !== undefined) {
    if (!changes.projectId?.trim()) {
      throw new Error('Every task must be linked to a project');
    }
    const { data: project, error: projectError } = await db
      .from('projects')
      .select('id')
      .eq('id', changes.projectId)
      .eq('organization_id', org.id)
      .maybeSingle();
    if (projectError) throw new Error(projectError.message);
    if (!project) throw new Error('Project not found');
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (changes.title !== undefined) updates.title = changes.title;
  if (changes.description !== undefined) updates.description = changes.description;
  if (changes.status !== undefined) updates.status = changes.status;
  if (changes.dueDate !== undefined) updates.due_date = changes.dueDate;
  if (changes.priority !== undefined) updates.priority = changes.priority;
  if (hasAssigneeChange) updates.assignee_id = changes.assigneeId ?? null;
  if (changes.projectId !== undefined) updates.project_id = changes.projectId;

  const { data: updatedTask, error: updateError } = await db.from('tasks').update(updates).eq('id', taskId).select().single();
  if (updateError || !updatedTask) throw new Error(updateError?.message || 'Failed to update task');

  const activeStatuses = ['TO_DO', 'IN_PROGRESS', 'BLOCKED'] as const;
  const wasActive = activeStatuses.includes(currentTask.status);
  const isActive = hasStatusChange ? activeStatuses.includes(changes.status as (typeof activeStatuses)[number]) : wasActive;

  if (wasActive !== isActive && currentTask.assignee_id) {
    await recalculateTasksCount(currentTask.assignee_id, org.id);
  }

  const assigneeChanged = hasAssigneeChange && changes.assigneeId !== currentTask.assignee_id;
  if (assigneeChanged) {
    if (currentTask.assignee_id) {
      await recalculateTasksCount(currentTask.assignee_id, org.id);
    }
    if (changes.assigneeId) {
      await recalculateTasksCount(changes.assigneeId, org.id);
    }
  }

  const usersToUpdateMetrics = new Set<string>();
  if (assigneeChanged) {
    if (currentTask.assignee_id) usersToUpdateMetrics.add(currentTask.assignee_id);
    if (changes.assigneeId) usersToUpdateMetrics.add(changes.assigneeId);
  } else if (hasStatusChange && currentTask.assignee_id) {
    usersToUpdateMetrics.add(currentTask.assignee_id);
  }

  for (const userId of usersToUpdateMetrics) {
    schedulePerformanceMetricsUpdate(userId, org.id);
  }

  if (hasStatusChange && changes.status !== currentTask.status && currentTask.assignee_id) {
    const { data: assignee } = await db.from('users').select('*').eq('id', currentTask.assignee_id).maybeSingle();
    const { data: creator } = await db.from('users').select('*').eq('id', currentTask.created_by_id).maybeSingle();

    if (assignee && creator && creator.id !== assignee.id) {
      runInBackground('task-progress-email', async () => {
        await sendTaskProgressEmail({
          to: creator.email,
          toName: creator.name,
          taskTitle: updatedTask.title,
          taskDescription: updatedTask.description || '',
          assigneeName: assignee.name,
          status: changes.status as Task['status'],
          progressUpdate: `Task status changed from ${currentTask.status} to ${changes.status}`,
        });
      });
    }
  }

  if (assigneeChanged) {
    if (changes.assigneeId) {
      const { data: newAssignee } = await db.from('users').select('*').eq('id', changes.assigneeId).maybeSingle();
      const { data: creator } = await db.from('users').select('*').eq('id', currentTask.created_by_id).maybeSingle();

      if (newAssignee && creator) {
        runInBackground('task-reassignment-email', async () => {
          await sendTaskAssignmentEmail({
            to: newAssignee.email,
            toName: newAssignee.name,
            taskTitle: updatedTask.title,
            taskDescription: updatedTask.description || '',
            dueDate: updatedTask.due_date,
            assignerName: creator.name,
            assignerEmail: creator.email,
            priority: updatedTask.priority || 'MEDIUM',
            status: updatedTask.status,
          });
        });
      }
    }
  }

  return mapTask(updatedTask as DbTask);
}

// Delete a task
export async function deleteTask(taskId: string): Promise<void> {
  await requireAuth();
  const org = await requireOrganization();
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('User not found');

  const db = getDb();
  const { data: task, error: taskError } = await db
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .eq('organization_id', org.id)
    .maybeSingle();
  if (taskError) throw new Error(taskError.message);
  if (!task) throw new Error(`Task with id ${taskId} not found`);

  if (!(await canDeleteTask(task.created_by_id))) {
    throw new Error('You do not have permission to delete this task');
  }

  const { error: deleteError } = await db.from('tasks').delete().eq('id', taskId);
  if (deleteError) throw new Error(deleteError.message);

  if (task.assignee_id) {
    await recalculateTasksCount(task.assignee_id, org.id);
    schedulePerformanceMetricsUpdate(task.assignee_id, org.id);
  }
}

// Check if user has permission to invite (Owner or Admin)
async function canInviteUsers(userRole: string): Promise<boolean> {
  return userRole === 'OWNER' || userRole === 'ADMIN';
}

const INVITE_ROLES = ['ADMIN', 'MANAGER', 'EMPLOYEE'] as const;
type InviteRole = (typeof INVITE_ROLES)[number];

function isInviteRole(role: string): role is InviteRole {
  return INVITE_ROLES.includes(role as InviteRole);
}

// Create invite for admin, manager, or employee (owner/admin only)
export async function createInvite(
  email: string,
  role: InviteRole
): Promise<{ invite: any; inviteLink: string }> {
  await requireAuth();
  const org = await requireOrganization();
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('User not found');

  if (!(await canInviteUsers(currentUser.role))) {
    throw new Error('Only organization owners and admins can invite members');
  }

  if (role === 'ADMIN' && currentUser.role !== 'OWNER') {
    throw new Error('Only the organization owner can invite admins');
  }

  if (role === 'MANAGER' && currentUser.role !== 'OWNER' && currentUser.role !== 'ADMIN') {
    throw new Error('Only owners and admins can invite managers');
  }

  const db = getDb();
  const token = generateInviteToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const roleId = await getRoleIdBySlug(role);

  const { data: inviteRow, error: inviteError } = await db
    .from('invites')
    .insert({
      email,
      role,
      role_id: roleId,
      organization_id: org.id,
      invited_by_id: currentUser.id,
      token,
      used: false,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();
  if (inviteError || !inviteRow) throw new Error(inviteError?.message || 'Failed to create invite');

  const invite = mapInvite(inviteRow as DbInvite);
  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${invite.token}`;

  runInBackground('invite-email', async () => {
    await sendInviteEmail({
      to: email,
      role,
      inviteLink,
      organizationName: org.name,
      inviterName: currentUser.name,
    });
  });

  return { invite, inviteLink };
}

// Get all invites for current organization
export async function getInvites(): Promise<any[]> {
  await requireAuth();
  const org = await requireOrganization();
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('User not found');

  if (!(await canInviteUsers(currentUser.role))) {
    throw new Error('You do not have permission to view invites');
  }

  const db = getDb();
  const { data, error } = await db
    .from('invites')
    .select('*')
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => mapInvite(row as DbInvite));
}

// Add a member to organization (via invite acceptance)
export async function addMemberViaInvite(inviteToken: string, authUserId: string, name: string): Promise<User> {
  const db = getDb();
  const { data: invite, error: inviteError } = await db
    .from('invites')
    .select('*')
    .eq('token', inviteToken)
    .eq('used', false)
    .maybeSingle();

  if (inviteError) throw new Error(inviteError.message);
  if (!invite || new Date() > new Date(invite.expires_at)) {
    throw new Error('Invalid or expired invite');
  }

  const { data: existingUser, error: existingUserError } = await db
    .from('users')
    .select('id')
    .eq('email', invite.email)
    .eq('organization_id', invite.organization_id)
    .maybeSingle();
  if (existingUserError) throw new Error(existingUserError.message);
  if (existingUser) throw new Error('User already exists in this organization');

  const dbRole = isInviteRole(invite.role) ? invite.role : 'EMPLOYEE';
  const roleId =
    invite.role_id ?? (await getRoleIdBySlug(dbRole));

  const { data: newUser, error: createUserError } = await db
    .from('users')
    .insert({
      auth_user_id: authUserId,
      name,
      email: invite.email,
      organization_id: invite.organization_id,
      role_id: roleId,
      role: dbRole,
      tasks_count: 0,
    })
    .select()
    .single();
  if (createUserError || !newUser) throw new Error(createUserError?.message || 'Failed to create user');

  const { error: markUsedError } = await db.from('invites').update({ used: true }).eq('token', inviteToken);
  if (markUsedError) throw new Error(markUsedError.message);

  try {
    const { data: orgRow, error: orgError } = await db
      .from('organizations')
      .select('*')
      .eq('id', invite.organization_id)
      .maybeSingle();
    if (orgError) throw new Error(orgError.message);

    if (orgRow) {
      const organization = mapOrganization(orgRow as DbOrganization);
      runInBackground('welcome-email', async () => {
        await sendWelcomeEmail(invite.email, name, organization.name);
      });
    }
  } catch (error) {
    console.error('Error loading organization for welcome email:', error);
  }

  return mapUser(newUser as DbUser);
}

// Add a comment to a task
export async function addTaskComment(taskId: string, content: string): Promise<any> {
  await requireAuth();
  const org = await requireOrganization();
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('User not found');

  const db = getDb();
  const { data: task, error: taskError } = await db
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .eq('organization_id', org.id)
    .maybeSingle();
  if (taskError) throw new Error(taskError.message);
  if (!task) throw new Error('Task not found');

  if (!(await canCommentOnTask(task.assignee_id || null))) {
    throw new Error('You do not have permission to comment on this task');
  }

  const { data: newComment, error: createCommentError } = await db
    .from('task_comments')
    .insert({
      task_id: taskId,
      user_id: currentUser.id,
      content: content.trim(),
    })
    .select()
    .single();
  if (createCommentError || !newComment) {
    throw new Error(createCommentError?.message || 'Failed to create comment');
  }

  const { data: userRow } = await db.from('users').select('*').eq('id', currentUser.id).maybeSingle();

  return {
    ...mapTaskComment(newComment as DbTaskComment),
    user: userRow ? mapUser(userRow as DbUser) : currentUser,
  };
}

// Get comments for a task
export async function getTaskComments(taskId: string): Promise<any[]> {
  await requireAuth();
  const org = await requireOrganization();
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('User not found');

  const db = getDb();
  const { data: task, error: taskError } = await db
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .eq('organization_id', org.id)
    .maybeSingle();
  if (taskError) throw new Error(taskError.message);
  if (!task) throw new Error('Task not found');

  if (currentUser.role === 'EMPLOYEE' && task.assignee_id !== currentUser.id) {
    throw new Error('You do not have permission to view this task');
  }

  const { data: commentRows, error: commentsError } = await db
    .from('task_comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });
  if (commentsError) throw new Error(commentsError.message);

  const comments = (commentRows ?? []) as DbTaskComment[];
  const userIds = Array.from(new Set(comments.map((comment) => comment.user_id)));

  let usersById = new Map<string, User>();
  if (userIds.length > 0) {
    const { data: userRows, error: usersError } = await db.from('users').select('*').in('id', userIds);
    if (usersError) throw new Error(usersError.message);
    usersById = new Map((userRows ?? []).map((user) => [user.id, mapUser(user as DbUser)]));
  }

  return comments.map((comment) => ({
    ...mapTaskComment(comment),
    user: usersById.get(comment.user_id) ?? null,
  }));
}

// Get organization trial status
export const getTrialStatus = cache(async () => {
  const user = await getCurrentUser();
  if (!user?.organization) throw new Error('No organization found');
  const org = user.organization;

  const now = new Date();
  const trialEnd = new Date(org.trialEndDate);

  const isActive = now <= trialEnd;
  const daysRemaining = isActive ? Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return {
    isActive,
    daysRemaining,
    status: org.subscriptionStatus,
    trialEndDate: org.trialEndDate,
  };
});

const TEAM_ROLES: UserRole[] = ['ADMIN', 'MANAGER', 'EMPLOYEE'];

export async function updateMemberRole(memberId: string, role: UserRole): Promise<User> {
  await requireAuth();
  const org = await requireOrganization();
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('User not found');

  if (!(await canManageTeamMembers())) {
    throw new Error('Only organization owners and admins can update member roles');
  }

  if (!TEAM_ROLES.includes(role)) {
    throw new Error('Invalid role for team member');
  }

  if (role === 'ADMIN' && currentUser.role !== 'OWNER') {
    throw new Error('Only the organization owner can assign admin role');
  }

  const db = getDb();
  const { data: member, error: memberError } = await db
    .from('users')
    .select('*')
    .eq('id', memberId)
    .eq('organization_id', org.id)
    .maybeSingle();
  if (memberError) throw new Error(memberError.message);
  if (!member) throw new Error('Member not found');

  if (member.role === 'OWNER') {
    throw new Error('Cannot change the organization owner role');
  }

  if (currentUser.role === 'ADMIN' && member.role === 'ADMIN') {
    throw new Error('Admins cannot change other admins');
  }

  const roleId = await getRoleIdBySlug(role);

  const { data: updated, error: updateError } = await db
    .from('users')
    .update({ role_id: roleId, role, updated_at: new Date().toISOString() })
    .eq('id', memberId)
    .eq('organization_id', org.id)
    .select()
    .single();
  if (updateError || !updated) throw new Error(updateError?.message || 'Failed to update member');

  invalidateUserProfile((updated as DbUser).auth_user_id);

  return mapUser(updated as DbUser);
}

export async function removeMemberFromOrganization(memberId: string): Promise<void> {
  await requireAuth();
  const org = await requireOrganization();
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('User not found');

  if (!(await canManageTeamMembers())) {
    throw new Error('Only organization owners and admins can remove members');
  }

  if (memberId === currentUser.id) {
    throw new Error('You cannot remove yourself from the organization');
  }

  const db = getDb();
  const { data: member, error: memberError } = await db
    .from('users')
    .select('*')
    .eq('id', memberId)
    .eq('organization_id', org.id)
    .maybeSingle();
  if (memberError) throw new Error(memberError.message);
  if (!member) throw new Error('Member not found');

  if (member.role === 'OWNER') {
    throw new Error('Cannot remove the organization owner');
  }

  if (currentUser.role === 'ADMIN' && member.role === 'ADMIN') {
    throw new Error('Admins cannot remove other admins');
  }

  const { error: deleteError } = await db.from('users').delete().eq('id', memberId).eq('organization_id', org.id);
  if (deleteError) throw new Error(deleteError.message);
}
