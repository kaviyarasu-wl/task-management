import { TaskPriority, TaskStatus, TenantPlan, UserRole } from './api.types';

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

export interface Task {
  _id: string;
  title: string;
  description?: string;
  projectId: string;
  assigneeId?: string;
  reporterId: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  completedAt?: string;
  tags: string[];
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}
