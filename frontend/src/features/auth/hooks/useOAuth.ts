import { useState, useCallback } from 'react';
import { oauthApi } from '../services/oauthApi';
import { toast } from '@/shared/stores/toastStore';
import type { OAuthProvider } from '../types/oauth.types';

export function useOAuth() {
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);

  const initiateOAuth = useCallback(async (provider: OAuthProvider) => {
    try {
      setLoadingProvider(provider);

      const response = await oauthApi.getAuthUrl(provider);
      const { url, state } = response.data;

      // Store state in sessionStorage for CSRF validation on callback
      sessionStorage.setItem('oauth_state', state);
      sessionStorage.setItem('oauth_provider', provider);

      // Redirect to OAuth provider
      window.location.href = url;
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || `Failed to connect to ${provider}`;
      toast({ type: 'error', title: 'OAuth Error', message });
      setLoadingProvider(null);
    }
  }, []);

  return {
    initiateOAuth,
    loadingProvider,
    isLoading: loadingProvider !== null,
  };
}
