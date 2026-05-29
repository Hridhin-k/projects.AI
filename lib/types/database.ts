export type TaskStatus = 'TO_DO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
export type Plan = 'FREE_TRIAL' | 'BASIC' | 'PRO' | 'ENTERPRISE';
export type ProjectPhase =
  | 'PLANNING'
  | 'DESIGN'
  | 'DEVELOPMENT'
  | 'TESTING'
  | 'STAGING'
  | 'DEPLOYMENT'
  | 'DEPLOYED'
  | 'MAINTENANCE'
  | 'ARCHIVED';
export type DeploymentEnvironment = 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION';
export type DeploymentStatus = 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILED' | 'ROLLED_BACK';

export interface Organization {
  id: string;
  name: string;
  subscription_status: SubscriptionStatus;
  trial_start_date: string;
  trial_end_date: string;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  plan: Plan;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  auth_user_id: string;
  name: string;
  email: string;
  organization_id: string | null;
  role: UserRole;
  tasks_count: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  assignee_id: string | null;
  status: TaskStatus;
  due_date: string;
  priority: TaskPriority | null;
  project_id: string;
  organization_id: string;
  created_by_id: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  phase: ProjectPhase;
  organization_id: string;
  created_by_id: string;
  repository_url: string | null;
  deployment_url: string | null;
  tech_stack: string | null;
  start_date: string | null;
  target_deploy_date: string | null;
  deployed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectMilestone {
  id: string;
  project_id: string;
  title: string;
  phase: ProjectPhase;
  completed: boolean;
  sort_order: number;
  completed_at: string | null;
  created_at: string;
}

export interface Deployment {
  id: string;
  project_id: string;
  environment: DeploymentEnvironment;
  version: string;
  status: DeploymentStatus;
  notes: string | null;
  deployed_by_id: string | null;
  deployed_at: string | null;
  created_at: string;
}

export interface Invite {
  id: string;
  email: string;
  role: UserRole;
  organization_id: string;
  invited_by_id: string;
  token: string;
  used: boolean;
  expires_at: string;
  created_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface PerformanceMetric {
  id: string;
  user_id: string;
  organization_id: string;
  completion_rate: number;
  average_time_days: number;
  tasks_completed: number;
  tasks_in_progress: number;
  tasks_overdue: number;
  last_ai_evaluation: string | null;
  evaluation_date: string | null;
  created_at: string;
  updated_at: string;
}

/** CamelCase app models (mapped from DB rows) */
export function mapUser(row: User): import('@/lib/db/schema').User {
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    name: row.name,
    email: row.email,
    organizationId: row.organization_id,
    role: row.role,
    tasksCount: row.tasks_count,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function mapOrganization(row: Organization): import('@/lib/db/schema').Organization {
  return {
    id: row.id,
    name: row.name,
    subscriptionStatus: row.subscription_status,
    trialStartDate: new Date(row.trial_start_date),
    trialEndDate: new Date(row.trial_end_date),
    subscriptionStartDate: row.subscription_start_date ? new Date(row.subscription_start_date) : null,
    subscriptionEndDate: row.subscription_end_date ? new Date(row.subscription_end_date) : null,
    plan: row.plan,
    isActive: row.is_active ?? true,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function mapTask(row: Task): import('@/lib/db/schema').Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    assigneeId: row.assignee_id,
    status: row.status,
    dueDate: row.due_date,
    priority: row.priority,
    projectId: row.project_id,
    organizationId: row.organization_id,
    createdById: row.created_by_id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function mapProject(row: Project): import('@/lib/db/schema').Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    phase: row.phase,
    organizationId: row.organization_id,
    createdById: row.created_by_id,
    repositoryUrl: row.repository_url,
    deploymentUrl: row.deployment_url,
    techStack: row.tech_stack,
    startDate: row.start_date ? new Date(row.start_date) : null,
    targetDeployDate: row.target_deploy_date ? new Date(row.target_deploy_date) : null,
    deployedAt: row.deployed_at ? new Date(row.deployed_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
