import { api } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types/api.types';
import type {
  Role,
  CreateRoleData,
  UpdateRoleData,
  PermissionCategory,
} from '../types/role.types';

export const roleApi = {
  list: async (): Promise<ApiResponse<Role[]>> => {
    const { data } = await api.get<ApiResponse<Role[]>>('/roles');
    return data;
  },

  getById: async (roleId: string): Promise<ApiResponse<Role>> => {
    const { data } = await api.get<ApiResponse<Role>>(`/roles/${roleId}`);
    return data;
  },

  create: async (payload: CreateRoleData): Promise<ApiResponse<Role>> => {
    const { data } = await api.post<ApiResponse<Role>>('/roles', payload);
    return data;
  },

  update: async (
    roleId: string,
    payload: UpdateRoleData
  ): Promise<ApiResponse<Role>> => {
    const { data } = await api.patch<ApiResponse<Role>>(
      `/roles/${roleId}`,
      payload
    );
    return data;
  },

  delete: async (roleId: string): Promise<ApiResponse<null>> => {
    const { data } = await api.delete<ApiResponse<null>>(`/roles/${roleId}`);
    return data;
  },

  getPermissions: async (): Promise<ApiResponse<PermissionCategory[]>> => {
    const { data } = await api.get<ApiResponse<PermissionCategory[]>>(
      '/roles/permissions'
    );
    return data;
  },
};
