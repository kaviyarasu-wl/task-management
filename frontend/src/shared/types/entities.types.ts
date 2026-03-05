import { TaskPriority, TenantPlan, UserRole } from './api.types';
import type { Status } from '@/features/statuses/types/status.types';
import type { RecurrencePattern } from '@/features/tasks/types/recurrence.types';

// Re-export for convenience
export type { TaskPriority, TenantPlan, UserRole };
export type { Status };
export type { RecurrencePattern };

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isEmailVerified: boolean;
  lastLoginAt?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  _id: string;
  tenantId: string;
  name: string;
  slug: string;
  plan: TenantPlan;
  ownerId: string;
  settings: {
    maxUsers: number;
    maxProjects: number;
    allowedPlugins: string[];
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  planDetails?: {
    _id: string;
    name: string;
    slug: string;
    description: string;
    projectsLimit: number;
    usersLimit: number;
    price: number;
    billingCycle: 'monthly' | 'yearly';
    features: string[];
    isActive: boolean;
  };
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  ownerId: string;
  memberIds: string[];
  isArchived: boolean;
  color?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

// Minimal user info for populated assignee
export interface TaskAssignee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  projectId: string;
  assigneeId?: string;
  assignee?: TaskAssignee; // Populated assignee object
  reporterId: string;
  status: Status; // Populated Status object
  statusId: string; // Status ID for mutations
  priority: TaskPriority;
  dueDate?: string;
  completedAt?: string;
  tags: string[];
  recurrence?: RecurrencePattern; // Recurrence pattern for recurring tasks
  recurrenceId?: string; // Reference to recurrence rule
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}
