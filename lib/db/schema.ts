/** Application domain types (camelCase). DB rows use snake_case in lib/types/database.ts */

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
  subscriptionStatus: SubscriptionStatus;
  trialStartDate: Date;
  trialEndDate: Date;
  subscriptionStartDate: Date | null;
  subscriptionEndDate: Date | null;
  plan: Plan;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  authUserId: string;
  name: string;
  email: string;
  organizationId: string | null;
  role: UserRole;
  tasksCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  assigneeId: string | null;
  status: TaskStatus;
  dueDate: string;
  priority: TaskPriority | null;
  projectId: string;
  organizationId: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  phase: ProjectPhase;
  organizationId: string;
  createdById: string;
  repositoryUrl: string | null;
  deploymentUrl: string | null;
  techStack: string | null;
  startDate: Date | null;
  targetDeployDate: Date | null;
  deployedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  title: string;
  phase: ProjectPhase;
  completed: boolean;
  sortOrder: number;
  completedAt: Date | null;
  createdAt: Date;
}

export interface Deployment {
  id: string;
  projectId: string;
  environment: DeploymentEnvironment;
  version: string;
  status: DeploymentStatus;
  notes: string | null;
  deployedById: string | null;
  deployedAt: Date | null;
  createdAt: Date;
}

export interface Invite {
  id: string;
  email: string;
  role: UserRole;
  organizationId: string;
  invitedById: string;
  token: string;
  used: boolean;
  expiresAt: Date;
  createdAt: Date;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PerformanceMetric {
  id: string;
  userId: string;
  organizationId: string;
  completionRate: number;
  averageTimeDays: number;
  tasksCompleted: number;
  tasksInProgress: number;
  tasksOverdue: number;
  lastAIEvaluation: string | null;
  evaluationDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
