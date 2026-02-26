// API Response wrapper
export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  code: string;
  message: string;
  errors?: Record<string, string[]>;
}

// Pagination
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  nextCursor: string | null;
  total: number;
}

export interface PaginationParams {
  cursor?: string;
  limit?: number;
}

// User roles
export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';

// Task status & priority
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

// Tenant plan
export type TenantPlan = 'free' | 'pro' | 'enterprise';
