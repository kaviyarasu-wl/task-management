import { api } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types/api.types';
import type {
  AdminTenant,
  AdminTenantDetail,
  TenantSearchParams,
  PaginatedTenants,
} from '../types/adminTenant.types';

export const adminTenantsApi = {
  getAll: async (params?: TenantSearchParams): Promise<PaginatedTenants> => {
    const { data } = await api.get<
      ApiResponse<AdminTenant[]> & {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }
    >('/admin/tenants', { params });
    return {
      data: data.data,
      total: data.total,
      page: data.page,
      limit: data.limit,
      totalPages: data.totalPages,
    };
  },

  getById: async (tenantId: string): Promise<AdminTenantDetail> => {
    const { data } = await api.get<ApiResponse<AdminTenantDetail>>(
      `/admin/tenants/${tenantId}`
    );
    return data.data;
  },

  update: async (
    tenantId: string,
    updateData: { name?: string; settings?: Partial<AdminTenant['settings']> }
  ): Promise<AdminTenant> => {
    const { data } = await api.patch<ApiResponse<AdminTenant>>(
      `/admin/tenants/${tenantId}`,
      updateData
    );
    return data.data;
  },

  changePlan: async (
    tenantId: string,
    planId: string
  ): Promise<AdminTenant> => {
    const { data } = await api.post<ApiResponse<AdminTenant>>(
      `/admin/tenants/${tenantId}/change-plan`,
      { planId }
    );
    return data.data;
  },

  suspend: async (
    tenantId: string,
    reason: string
  ): Promise<AdminTenant> => {
    const { data } = await api.post<ApiResponse<AdminTenant>>(
      `/admin/tenants/${tenantId}/suspend`,
      { reason }
    );
    return data.data;
  },

  activate: async (tenantId: string): Promise<AdminTenant> => {
    const { data } = await api.post<ApiResponse<AdminTenant>>(
      `/admin/tenants/${tenantId}/activate`
    );
    return data.data;
  },

  impersonate: async (
    tenantId: string,
    reason: string
  ): Promise<{
    impersonationToken: string;
    tenant: { tenantId: string; name: string; slug: string };
    impersonatedAs: { userId: string; email: string; role: string };
    expiresIn: number;
  }> => {
    const { data } = await api.post<ApiResponse<{
      impersonationToken: string;
      tenant: { tenantId: string; name: string; slug: string };
      impersonatedAs: { userId: string; email: string; role: string };
      expiresIn: number;
    }>>(
      `/admin/impersonate/${tenantId}`,
      { reason }
    );
    return data.data;
  },

  stopImpersonation: async (originalToken: string): Promise<void> => {
    await api.post('/admin/impersonate/stop', {}, {
      headers: { Authorization: `Bearer ${originalToken}` },
    });
  },
};
