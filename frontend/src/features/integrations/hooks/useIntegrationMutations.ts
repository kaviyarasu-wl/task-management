import { useMutation, useQueryClient } from '@tanstack/react-query';
import { integrationApi } from '../services/integrationApi';
import { integrationKeys } from './useIntegrations';
import { toast } from '@/shared/stores/toastStore';

export function useConnectIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (providerId: string) => integrationApi.connect(providerId),
    onSuccess: (response) => {
      if (response.data.redirectUrl) {
        window.location.href = response.data.redirectUrl;
      } else {
        queryClient.invalidateQueries({ queryKey: integrationKeys.connections() });
        toast({ type: 'success', title: 'Connected', message: 'Integration connected successfully.' });
      }
    },
    onError: () => {
      toast({ type: 'error', title: 'Connection Failed', message: 'Could not connect integration.' });
    },
  });
}

export function useCompleteOAuth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ providerId, code, state }: { providerId: string; code: string; state: string }) =>
      integrationApi.completeOAuth(providerId, code, state),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.connections() });
      toast({ type: 'success', title: 'Connected', message: 'OAuth integration connected.' });
    },
    onError: () => {
      toast({ type: 'error', title: 'OAuth Failed', message: 'Could not complete OAuth authorization.' });
    },
  });
}

export function useDisconnectIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (connectionId: string) => integrationApi.disconnect(connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.connections() });
      toast({ type: 'success', title: 'Disconnected', message: 'Integration disconnected.' });
    },
    onError: () => {
      toast({ type: 'error', title: 'Error', message: 'Could not disconnect integration.' });
    },
  });
}

export function useUpdateIntegrationConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ connectionId, config }: { connectionId: string; config: Record<string, unknown> }) =>
      integrationApi.updateConfig(connectionId, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.connections() });
      toast({ type: 'success', title: 'Updated', message: 'Integration configuration saved.' });
    },
    onError: () => {
      toast({ type: 'error', title: 'Error', message: 'Could not update configuration.' });
    },
  });
}
