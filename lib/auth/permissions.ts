"use server";

import { getCurrentUser } from './session';

/**
 * Permission helpers for role-based access control.
 */

export async function canCreateTasks(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return user.role === 'ADMIN' || user.role === 'OWNER' || user.role === 'MANAGER';
}

export async function canEditTask(taskAssigneeId: string | null, taskCreatedById: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  if (user.role === 'ADMIN' || user.role === 'OWNER') {
    return true;
  }

  if (user.role === 'MANAGER') {
    if (taskCreatedById === user.id) {
      return true;
    }
    return taskAssigneeId !== null;
  }

  return false;
}

export async function canDeleteTask(taskCreatedById: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  if (user.role === 'ADMIN' || user.role === 'OWNER') {
    return true;
  }

  if (user.role === 'MANAGER') {
    return taskCreatedById === user.id;
  }

  return false;
}

export async function canReassignTasks(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return user.role === 'ADMIN' || user.role === 'OWNER' || user.role === 'MANAGER';
}

export async function canChangeTaskStatus(taskAssigneeId: string | null): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  if (user.role === 'ADMIN' || user.role === 'OWNER' || user.role === 'MANAGER') {
    return true;
  }

  if (user.role === 'EMPLOYEE') {
    return taskAssigneeId === user.id;
  }

  return false;
}

export async function canManageTeamMembers(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return user.role === 'ADMIN' || user.role === 'OWNER';
}

export async function canCommentOnTask(taskAssigneeId: string | null): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  if (user.role === 'ADMIN' || user.role === 'OWNER' || user.role === 'MANAGER') {
    return true;
  }

  if (user.role === 'EMPLOYEE') {
    return taskAssigneeId === user.id;
  }

  return false;
}
