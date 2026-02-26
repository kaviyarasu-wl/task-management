export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';

export type TenantPlan = 'free' | 'pro' | 'enterprise';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';

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
