import { api } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types/api.types';
import type { User, Tenant } from '@/shared/types/entities.types';
import type { UpdateUserData, ChangePasswordData, UpdateRoleData } from '../types/user.types';

export const userApi = {
  // Current user
  getMe: async (): Promise<ApiResponse<User>> => {
    const { data } = await api.get<ApiResponse<User>>('/users/me');
    return data;
  },

  updateMe: async (userData: UpdateUserData): Promise<ApiResponse<User>> => {
    const { data } = await api.patch<ApiResponse<User>>('/users/me', userData);
    return data;
  },

  changePassword: async (passwordData: ChangePasswordData): Promise<ApiResponse<void>> => {
    const { data } = await api.post<ApiResponse<void>>(
      '/users/me/change-password',
      passwordData
    );
    return data;
  },

  // Team members
  getAll: async (): Promise<ApiResponse<User[]>> => {
    const { data } = await api.get<ApiResponse<User[]>>('/users');
    return data;
  },

  getById: async (userId: string): Promise<ApiResponse<User>> => {
    const { data } = await api.get<ApiResponse<User>>(`/users/${userId}`);
    return data;
  },

  updateRole: async (userId: string, roleData: UpdateRoleData): Promise<ApiResponse<User>> => {
    const { data } = await api.patch<ApiResponse<User>>(`/users/${userId}/role`, roleData);
    return data;
  },

  // Tenant members
  getMembers: async (): Promise<ApiResponse<User[]>> => {
    const { data } = await api.get<ApiResponse<User[]>>('/tenants/me/members');
    return data;
  },

  removeMember: async (userId: string): Promise<void> => {
    await api.delete(`/tenants/me/members/${userId}`);
  },

  // Tenant info
  getTenant: async (): Promise<ApiResponse<Tenant>> => {
    const { data } = await api.get<ApiResponse<Tenant>>('/tenants/me');
    return data;
  },
};
