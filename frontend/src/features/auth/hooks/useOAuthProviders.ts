import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { oauthApi } from '../services/oauthApi';
import { toast } from '@/shared/stores/toastStore';
import type { OAuthProvider } from '../types/oauth.types';

export function useLinkedProviders() {
  return useQuery({
    queryKey: ['oauth', 'providers'],
    queryFn: () => oauthApi.getLinkedProviders(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    select: (data) => data.data,
  });
}

export function useLinkProvider() {
  return useMutation({
    mutationFn: async (provider: OAuthProvider) => {
      const response = await oauthApi.linkProvider(provider);
      const { url, state } = response.data;

      // Store state and redirect (same flow as login)
      sessionStorage.setItem('oauth_state', state);
      sessionStorage.setItem('oauth_provider', provider);
      sessionStorage.setItem('oauth_action', 'link');

      window.location.href = url;
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to link provider';
      toast({ type: 'error', title: 'Link failed', message });
    },
  });
}

export function useUnlinkProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (provider: OAuthProvider) => oauthApi.unlinkProvider(provider),
    onSuccess: (_, provider) => {
      queryClient.invalidateQueries({ queryKey: ['oauth', 'providers'] });
      toast({
        type: 'success',
        title: 'Provider unlinked',
        message: `${provider.charAt(0).toUpperCase() + provider.slice(1)} has been disconnected from your account.`,
      });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to unlink provider';
      toast({ type: 'error', title: 'Unlink failed', message });
    },
  });
}
