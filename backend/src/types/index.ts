import type { IStatusDocument } from '../modules/status/status.model';

export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';

export type TenantPlan = 'free' | 'pro' | 'enterprise';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * @deprecated Use dynamic statuses from Status model instead.
 * Tasks now use status: ObjectId reference to Status collection.
 * This type is kept only for backward compatibility during migration.
 */
export type TaskStatusLegacy = 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';

// Status types for dynamic status management
export * from './status.types';

/**
 * Task with fully populated status object.
 * Used in API responses where status details are needed.
 */
export interface TaskWithStatus {
  _id: string;
  tenantId: string;
  title: string;
  description?: string;
  projectId: string;
  assigneeId?: string;
  reporterId: string;
  status: IStatusDocument; // Populated status object
  priority: TaskPriority;
  dueDate?: Date;
  completedAt?: Date;
  tags: string[];
  attachments: Array<{
    filename: string;
    url: string;
    uploadedAt: Date;
  }>;
  customFields: Map<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface RequestUser {
  userId: string;
  tenantId: string;
  email: string;
  role: UserRole;
}

export interface PaginationQuery {
  cursor?: string;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
  total: number;
}
