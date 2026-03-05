import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminTenantsApi } from '../services/adminTenantsApi';
import { toast } from '@/shared/stores/toastStore';

export function useAdminTenantMutations() {
  const queryClient = useQueryClient();

  const updateTenant = useMutation({
    mutationFn: ({
      tenantId,
      data,
    }: {
      tenantId: string;
      data: { name?: string; settings?: Record<string, unknown> };
    }) => adminTenantsApi.update(tenantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] });
      toast({ type: 'success', title: 'Tenant updated' });
    },
    onError: (error: any) => {
      toast({
        type: 'error',
        title: error.response?.data?.message || 'Failed to update tenant',
      });
    },
  });

  const changePlan = useMutation({
    mutationFn: ({ tenantId, planId }: { tenantId: string; planId: string }) =>
      adminTenantsApi.changePlan(tenantId, planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] });
      toast({ type: 'success', title: 'Tenant plan changed' });
    },
    onError: (error: any) => {
      toast({
        type: 'error',
        title: error.response?.data?.message || 'Failed to change plan',
      });
    },
  });

  const suspendTenant = useMutation({
    mutationFn: ({ tenantId, reason }: { tenantId: string; reason: string }) =>
      adminTenantsApi.suspend(tenantId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] });
      toast({ type: 'success', title: 'Tenant suspended' });
    },
    onError: (error: any) => {
      toast({
        type: 'error',
        title: error.response?.data?.message || 'Failed to suspend tenant',
      });
    },
  });

  const activateTenant = useMutation({
    mutationFn: (tenantId: string) => adminTenantsApi.activate(tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] });
      toast({ type: 'success', title: 'Tenant activated' });
    },
    onError: (error: any) => {
      toast({
        type: 'error',
        title: error.response?.data?.message || 'Failed to activate tenant',
      });
    },
  });

  const impersonate = useMutation({
    mutationFn: ({ tenantId, reason }: { tenantId: string; reason: string }) =>
      adminTenantsApi.impersonate(tenantId, reason),
    onSuccess: () => {
      toast({ type: 'success', title: 'Impersonation started' });
    },
    onError: (error: any) => {
      toast({
        type: 'error',
        title: error.response?.data?.message || 'Failed to impersonate',
      });
    },
  });

  return { updateTenant, changePlan, suspendTenant, activateTenant, impersonate };
}
