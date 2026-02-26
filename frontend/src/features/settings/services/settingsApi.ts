import { api } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types/api.types';
import type { Tenant } from '@/shared/types/entities.types';
import type { UpdateTenantSettingsData } from '../types/settings.types';

export const settingsApi = {
  getTenant: async (): Promise<ApiResponse<Tenant>> => {
    const { data } = await api.get<ApiResponse<Tenant>>('/tenants/me');
    return data;
  },

  updateSettings: async (
    settings: UpdateTenantSettingsData
  ): Promise<ApiResponse<Tenant>> => {
    const { data } = await api.patch<ApiResponse<Tenant>>(
      '/tenants/me/settings',
      settings
    );
    return data;
  },
};
