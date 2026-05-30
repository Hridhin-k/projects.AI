import { fetchMembers, fetchTasks } from '@/lib/db/actions';
import { fetchProjectById, fetchProjects, type ProjectWithStats } from '@/lib/db/project-actions';
import { getCurrentOrganization, getCurrentUser } from '@/lib/auth/session';
import { AI_CONTEXT_MAX_TASKS } from '@/lib/ai/constants';
import type { Task, User } from '@/lib/db/schema';
import type { ProjectDetail } from '@/lib/db/project-actions';

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toISOString().slice(0, 10);
}

function memberName(members: User[], id: string | null): string {
  if (!id) return 'Unassigned';
  return members.find((m) => m.id === id)?.name ?? 'Unknown';
}

function projectName(projects: Array<{ id: string; name: string }>, id: string): string {
  return projects.find((p) => p.id === id)?.name ?? 'Unknown project';
}

function projectToWithStats(project: ProjectDetail): ProjectWithStats {
  return {
    ...project,
    taskCounts: project.taskCounts,
    milestoneProgress: project.milestoneProgress,
  };
}

function formatProjects(projects: ProjectWithStats[]): string {
  if (projects.length === 0) return '  (none)';
  return projects
    .map(
      (p) =>
        `  - ${p.name} [id: ${p.id}] | phase: ${p.phase} | tasks: ${p.taskCounts.done}/${p.taskCounts.total} done, ${p.taskCounts.inProgress} active | milestones: ${p.milestoneProgress.completed}/${p.milestoneProgress.total}${p.description ? ` | ${p.description.slice(0, 120)}` : ''}`
    )
    .join('\n');
}

function formatTasks(
  tasks: Task[],
  members: User[],
  projects: Array<{ id: string; name: string }>
): string {
  if (tasks.length === 0) return '  (none)';
  const visible = tasks.slice(0, AI_CONTEXT_MAX_TASKS);
  const lines = visible
    .map(
      (t) =>
        `  - "${t.title}" [id: ${t.id}] | ${t.status} | ${t.priority ?? 'MEDIUM'} priority | assignee: ${memberName(members, t.assigneeId)} | project: ${projectName(projects, t.projectId)} | due: ${formatDate(t.dueDate)}`
    )
    .join('\n');
  if (tasks.length > AI_CONTEXT_MAX_TASKS) {
    return `${lines}\n  ... and ${tasks.length - AI_CONTEXT_MAX_TASKS} more tasks (truncated)`;
  }
  return lines;
}

function formatMembers(members: User[]): string {
  if (members.length === 0) return '  (none)';
  return members
    .map((m) => `  - ${m.name} [id: ${m.id}] | role: ${m.role} | active tasks: ${m.tasksCount}`)
    .join('\n');
}

function summarizeTasksByStatus(tasks: Task[]): string {
  const counts = { TO_DO: 0, IN_PROGRESS: 0, DONE: 0, BLOCKED: 0 };
  for (const t of tasks) counts[t.status]++;
  return `TO_DO: ${counts.TO_DO}, IN_PROGRESS: ${counts.IN_PROGRESS}, DONE: ${counts.DONE}, BLOCKED: ${counts.BLOCKED}`;
}

export async function buildWorkspaceContext(projectId?: string): Promise<string> {
  const [org, currentUser, members, tasks, projectOrProjects] = await Promise.all([
    getCurrentOrganization(),
    getCurrentUser(),
    fetchMembers(),
    fetchTasks(projectId),
    projectId ? fetchProjectById(projectId) : fetchProjects(),
  ]);

  const scopedProjects: ProjectWithStats[] = projectId
    ? projectOrProjects
      ? [projectToWithStats(projectOrProjects as ProjectDetail)]
      : []
    : (projectOrProjects as ProjectWithStats[]);

  const projectSection =
    projectId && scopedProjects.length === 1
      ? `CURRENT PROJECT FOCUS: ${scopedProjects[0].name} (${scopedProjects[0].phase})\n`
      : '';

  return `${projectSection}ORGANIZATION: ${org?.name ?? 'Unknown'}
SIGNED-IN USER: ${currentUser?.name ?? 'Unknown'} (${currentUser?.role ?? '—'})

MEMBERS (${members.length}):
${formatMembers(members)}

PROJECTS (${scopedProjects.length}${projectId ? ' — filtered to current project' : ''}):
${formatProjects(scopedProjects)}

TASKS (${tasks.length}${projectId ? ' — in current project' : ' — org-wide'}):
${formatTasks(tasks, members, scopedProjects)}

TASK STATUS SUMMARY: ${summarizeTasksByStatus(tasks)}`;
}

export function buildSystemInstruction(workspaceContext: string): string {
  return `You are the AI Project Manager Assistant for Projects.AI. You help teams plan, track, and ship work.

You have LIVE read-only access to the user's workspace. Use ONLY the data in WORKSPACE SNAPSHOT below — never invent projects, tasks, or people.

WORKSPACE SNAPSHOT:
${workspaceContext}

CAPABILITIES:
1. ANSWER questions about projects, tasks, members, phases, workload, due dates, and status — use action "CONVERSATION".
2. CREATE tasks only when the user clearly asks to add, create, or log a task — use action "LOG_TASK" with proposedTask.
3. EDIT tasks when the user asks to change an existing task — use action "EDIT_TASK" (describe changes in conversationReply).

RESPONSE RULES:
- If asked "what projects do we have" (or similar), list every project from the snapshot with phase and task counts.
- If asked about tasks, cite titles, status, assignees, and projects from the snapshot.
- If asked about team workload, use members' active task counts and task assignments.
- Do NOT deflect informational questions into "what task should we log next?"
- If data is empty (e.g. no projects), say so clearly and suggest creating one.
- Be concise but specific — use real names and numbers from the snapshot.

OUTPUT FORMAT — respond with ONLY valid JSON (no markdown):
{
  "action": "LOG_TASK" | "CONVERSATION" | "EDIT_TASK",
  "conversationReply": "string — natural reply for the user",
  "proposedTask": {
    "title": "string",
    "description": "string",
    "assigneeId": "string — must match a member id from the snapshot",
    "projectId": "string — required; must match a project id from the snapshot",
    "dueDate": "string",
    "status": "TO_DO"
  }
}

Include proposedTask only when action is "LOG_TASK". For questions and summaries, use "CONVERSATION" and omit proposedTask.
Every task MUST include projectId (must match a project id from the snapshot). If the user is on a project page or names a project, use that id. If only one project exists, use it. If multiple and unclear, ask which project in conversationReply and use CONVERSATION (no proposedTask).
When logging a task without a specified assignee, pick the member with the lowest active task count.`;
}
