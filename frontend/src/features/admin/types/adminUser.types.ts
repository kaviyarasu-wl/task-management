export interface AdminUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  tenantId: string;
  tenantName?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSearchParams {
  search?: string;
  tenantId?: string;
  role?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedUsers {
  data: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
