import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminTenantsApi } from '../services/adminTenantsApi';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useToastStore } from '@/shared/stores/toastStore';
import { ROUTES } from '@/shared/constants/routes';

export function useImpersonation() {
  const navigate = useNavigate();
  const {
    startImpersonation,
    stopImpersonation,
    isImpersonating,
    impersonatedTenant,
  } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  const impersonate = useMutation({
    mutationFn: ({ tenantId, reason }: { tenantId: string; reason: string }) =>
      adminTenantsApi.impersonate(tenantId, reason),
    onSuccess: (data) => {
      startImpersonation(
        {
          tenantId: data.tenant.tenantId,
          name: data.tenant.name,
          slug: data.tenant.slug,
        },
        data.impersonationToken
      );

      addToast({
        type: 'info',
        title: `Now impersonating ${data.tenant.name}`,
        duration: 5000,
      });

      navigate(ROUTES.DASHBOARD);
    },
    onError: async (
      error: Error & { response?: { data?: { message?: string } } },
      variables
    ) => {
      const message = error.response?.data?.message || '';

      // Auto-stop stale backend session and retry
      if (message.includes('Already impersonating')) {
        const currentToken = useAuthStore.getState().accessToken;
        if (currentToken) {
          try {
            await adminTenantsApi.stopImpersonation(currentToken);
            addToast({ type: 'info', title: 'Cleared stale session, retrying...' });
            impersonate.mutate(variables);
            return;
          } catch {
            // Fall through to error toast
          }
        }
      }

      addToast({
        type: 'error',
        title: 'Failed to start impersonation',
        message,
      });
    },
  });

  const exitImpersonation = async () => {
    const originalToken = useAuthStore.getState().originalAccessToken;

    if (originalToken) {
      try {
        await adminTenantsApi.stopImpersonation(originalToken);
      } catch (error) {
        console.error('Failed to stop impersonation on backend:', error);
      }
    }

    stopImpersonation();
    addToast({
      type: 'info',
      title: 'Impersonation ended',
    });
    navigate(ROUTES.ADMIN_TENANTS);
  };

  return {
    impersonate,
    exitImpersonation,
    isImpersonating: isImpersonating(),
    impersonatedTenant,
  };
}
