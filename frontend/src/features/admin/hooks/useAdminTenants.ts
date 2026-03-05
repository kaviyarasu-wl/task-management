import { useQuery } from '@tanstack/react-query';
import { adminTenantsApi } from '../services/adminTenantsApi';
import type { TenantSearchParams } from '../types/adminTenant.types';

export function useAdminTenants(params?: TenantSearchParams) {
  return useQuery({
    queryKey: ['admin', 'tenants', params],
    queryFn: () => adminTenantsApi.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useAdminTenant(tenantId: string) {
  return useQuery({
    queryKey: ['admin', 'tenants', tenantId],
    queryFn: () => adminTenantsApi.getById(tenantId),
    enabled: Boolean(tenantId),
  });
}
