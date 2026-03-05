import { api } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types/api.types';
import type { User } from '@/shared/types/entities.types';
import type { AdminLoginCredentials, AdminLoginResponse, SafeSuperAdmin } from '../types/adminAuth.types';

export const adminAuthApi = {
  login: async (credentials: AdminLoginCredentials): Promise<ApiResponse<AdminLoginResponse>> => {
    const { data } = await api.post<ApiResponse<AdminLoginResponse>>('/admin/auth/login', credentials);
    return data;
  },

  logout: async (): Promise<void> => {
    await api.post('/admin/auth/logout');
  },

  refresh: async (refreshToken: string): Promise<ApiResponse<{ accessToken: string }>> => {
    const { data } = await api.post<ApiResponse<{ accessToken: string }>>('/admin/auth/refresh', { refreshToken });
    return data;
  },

  getMe: async (): Promise<ApiResponse<User>> => {
    const { data } = await api.get<ApiResponse<SafeSuperAdmin>>('/admin/auth/me');
    const admin = data.data;

    const mappedUser: User = {
      _id: admin._id,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      role: 'superadmin',
      tenantId: '',
      isEmailVerified: true,
      lastLoginAt: admin.lastLoginAt,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    };

    return { success: true, data: mappedUser };
  },
};
