"use server";

import { getCurrentUser } from './session';
import type { User } from '@/lib/db/schema';

export type UserRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

/**
 * Permission helper functions for role-based access control
 */

// Check if user is Admin or Owner
export async function isAdminOrOwner(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return user.role === 'ADMIN' || user.role === 'OWNER';
}

// Check if user is Manager
export async function isManager(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return user.role === 'MANAGER';
}

// Check if user is Member/Employee
export async function isMember(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return user.role === 'EMPLOYEE';
}

// Check if user can view all tasks
export async function canViewAllTasks(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return user.role === 'ADMIN' || user.role === 'OWNER' || user.role === 'MANAGER';
}

// Check if user can create tasks
export async function canCreateTasks(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return user.role === 'ADMIN' || user.role === 'OWNER' || user.role === 'MANAGER';
}

// Check if user can edit a specific task
export async function canEditTask(taskAssigneeId: string | null, taskCreatedById: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  
  // Admin/Owner can edit any task
  if (user.role === 'ADMIN' || user.role === 'OWNER') {
    return true;
  }
  
  // Manager can edit tasks assigned to members (not other managers)
  if (user.role === 'MANAGER') {
    // Can edit if they created it
    if (taskCreatedById === user.id) {
      return true;
    }
    // Can edit if assigned to a member (not another manager)
    if (taskAssigneeId) {
      // We'll need to check if assignee is a member, not a manager
      // This will be checked in the action itself
      return true; // Will be validated further
    }
    return false;
  }
  
  // Member can only edit their own assigned tasks
  if (user.role === 'EMPLOYEE') {
    return taskAssigneeId === user.id;
  }
  
  return false;
}

// Check if user can delete a task
export async function canDeleteTask(taskCreatedById: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  
  // Admin/Owner can delete any task
  if (user.role === 'ADMIN' || user.role === 'OWNER') {
    return true;
  }
  
  // Manager can delete tasks they created
  if (user.role === 'MANAGER') {
    return taskCreatedById === user.id;
  }
  
  // Members cannot delete tasks
  return false;
}

// Check if user can reassign tasks
export async function canReassignTasks(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return user.role === 'ADMIN' || user.role === 'OWNER' || user.role === 'MANAGER';
}

// Check if user can change task status
export async function canChangeTaskStatus(taskAssigneeId: string | null): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  
  // Admin/Owner/Manager can change any task status
  if (user.role === 'ADMIN' || user.role === 'OWNER' || user.role === 'MANAGER') {
    return true;
  }
  
  // Member can only change status of their own tasks
  if (user.role === 'EMPLOYEE') {
    return taskAssigneeId === user.id;
  }
  
  return false;
}

// Check if user can view all members
export async function canViewAllMembers(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return user.role === 'ADMIN' || user.role === 'OWNER' || user.role === 'MANAGER';
}

// Check if user can view a specific member's profile
export async function canViewMemberProfile(memberId: string, memberRole: UserRole): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  
  // Admin/Owner can view anyone
  if (user.role === 'ADMIN' || user.role === 'OWNER') {
    return true;
  }
  
  // Manager can view members (not other managers or admins)
  if (user.role === 'MANAGER') {
    return memberRole === 'EMPLOYEE';
  }
  
  // Member can only view their own profile
  if (user.role === 'EMPLOYEE') {
    return memberId === user.id;
  }
  
  return false;
}

// Check if user can invite members (org owner or admin only)
export async function canInviteMembers(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return user.role === 'ADMIN' || user.role === 'OWNER';
}

// Owner or admin can add, edit, or remove team members in their org
export async function canManageTeamMembers(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return user.role === 'ADMIN' || user.role === 'OWNER';
}

// Check if user can invite managers (Owner/Admin)
export async function canInviteManagers(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return user.role === 'ADMIN' || user.role === 'OWNER';
}

// Only org owner can invite other admins
export async function canInviteAdmins(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return user.role === 'OWNER';
}

// Check if user can comment on a task
export async function canCommentOnTask(taskAssigneeId: string | null): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  
  // Admin/Owner/Manager can comment on any task
  if (user.role === 'ADMIN' || user.role === 'OWNER' || user.role === 'MANAGER') {
    return true;
  }
  
  // Member can comment on their own tasks
  if (user.role === 'EMPLOYEE') {
    return taskAssigneeId === user.id;
  }
  
  return false;
}

// Check if user can view other managers (only Admin/Owner)
export async function canViewManagers(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return user.role === 'ADMIN' || user.role === 'OWNER';
}

// Check if user can view all tasks in organization
export async function canViewOrganizationTasks(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return user.role === 'ADMIN' || user.role === 'OWNER' || user.role === 'MANAGER';
}

