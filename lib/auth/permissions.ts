import type { User } from '@/lib/db/schema';

/** Sync permission checks — pass user from getCachedAuthContext() or getCurrentUser(). */

export function canCreateTasks(user: User): boolean {
  return user.role === 'ADMIN' || user.role === 'OWNER' || user.role === 'MANAGER';
}

export function canEditTask(
  user: User,
  taskAssigneeId: string | null,
  taskCreatedById: string
): boolean {
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

export function canDeleteTask(user: User, taskCreatedById: string): boolean {
  if (user.role === 'ADMIN' || user.role === 'OWNER') {
    return true;
  }

  if (user.role === 'MANAGER') {
    return taskCreatedById === user.id;
  }

  return false;
}

export function canReassignTasks(user: User): boolean {
  return user.role === 'ADMIN' || user.role === 'OWNER' || user.role === 'MANAGER';
}

export function canChangeTaskStatus(user: User, taskAssigneeId: string | null): boolean {
  if (user.role === 'ADMIN' || user.role === 'OWNER' || user.role === 'MANAGER') {
    return true;
  }

  if (user.role === 'EMPLOYEE') {
    return taskAssigneeId === user.id;
  }

  return false;
}

export function canManageTeamMembers(user: User): boolean {
  return user.role === 'ADMIN' || user.role === 'OWNER';
}

export function canCommentOnTask(user: User, taskAssigneeId: string | null): boolean {
  if (user.role === 'ADMIN' || user.role === 'OWNER' || user.role === 'MANAGER') {
    return true;
  }

  if (user.role === 'EMPLOYEE') {
    return taskAssigneeId === user.id;
  }

  return false;
}

export function canInviteUsers(user: User): boolean {
  return user.role === 'OWNER' || user.role === 'ADMIN';
}
