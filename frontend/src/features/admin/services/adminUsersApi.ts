import { api } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types/api.types';
import type {
  AdminUser,
  UserSearchParams,
  PaginatedUsers,
} from '../types/adminUser.types';

export const adminUsersApi = {
  search: async (params?: UserSearchParams): Promise<PaginatedUsers> => {
    const { data } = await api.get<
      ApiResponse<AdminUser[]> & {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }
    >('/admin/users', { params });
    return {
      data: data.data,
      total: data.total,
      page: data.page,
      limit: data.limit,
      totalPages: data.totalPages,
    };
  },

  getById: async (userId: string): Promise<AdminUser> => {
    const { data } = await api.get<ApiResponse<AdminUser>>(
      `/admin/users/${userId}`
    );
    return data.data;
  },

  update: async (
    userId: string,
    updateData: {
      firstName?: string;
      lastName?: string;
      role?: string;
    }
  ): Promise<AdminUser> => {
    const { data } = await api.patch<ApiResponse<AdminUser>>(
      `/admin/users/${userId}`,
      updateData
    );
    return data.data;
  },

  moveToTenant: async (
    userId: string,
    targetTenantId: string,
    newRole: string = 'member'
  ): Promise<AdminUser> => {
    const { data } = await api.post<ApiResponse<AdminUser>>(
      `/admin/users/${userId}/move`,
      { targetTenantId, newRole }
    );
    return data.data;
  },

  delete: async (userId: string): Promise<void> => {
    await api.delete(`/admin/users/${userId}`);
  },

  resetPassword: async (userId: string): Promise<{ tempPassword: string }> => {
    const { data } = await api.post<ApiResponse<{ tempPassword: string }>>(
      `/admin/users/${userId}/reset-password`
    );
    return data.data;
  },
};
