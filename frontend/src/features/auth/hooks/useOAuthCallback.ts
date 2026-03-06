import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { oauthApi } from '../services/oauthApi';
import { toast } from '@/shared/stores/toastStore';
import { ROUTES } from '@/shared/constants/routes';
import type { OAuthProvider, OAuthError } from '../types/oauth.types';

type CallbackStatus = 'loading' | 'success' | 'error';

export function useOAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [status, setStatus] = useState<CallbackStatus>('loading');
  const [error, setError] = useState<OAuthError | null>(null);

  // Prevent double execution in Strict Mode
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    async function handleCallback() {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');

      // Check for provider-side errors (e.g., user denied access)
      if (errorParam) {
        setStatus('error');
        setError({
          code: 'OAUTH_DENIED',
          message: getErrorMessage(errorParam),
        });
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setError({
          code: 'UNKNOWN_ERROR',
          message: 'Invalid callback parameters. Please try again.',
        });
        return;
      }

      // Validate state matches (CSRF protection)
      const storedState = sessionStorage.getItem('oauth_state');
      const storedProvider = sessionStorage.getItem('oauth_provider') as OAuthProvider | null;

      if (!storedState || storedState !== state || !storedProvider) {
        setStatus('error');
        setError({
          code: 'UNKNOWN_ERROR',
          message: 'Invalid session state. Please try signing in again.',
        });
        return;
      }

      try {
        const response = await oauthApi.callback(storedProvider, { code, state });
        const { user, accessToken, refreshToken, isNewUser } = response.data;

        // Set auth state
        setAuth(user, accessToken, refreshToken);

        // Clean up session storage
        sessionStorage.removeItem('oauth_state');
        sessionStorage.removeItem('oauth_provider');

        setStatus('success');

        toast({
          type: 'success',
          title: isNewUser ? 'Account created' : 'Signed in',
          message: `Welcome${isNewUser ? '' : ' back'}, ${user.firstName}!`,
        });

        // Navigate to dashboard
        navigate(ROUTES.DASHBOARD, { replace: true });
      } catch (err: unknown) {
        const serverError = (err as { response?: { data?: { code?: string; message?: string } } })
          ?.response?.data;
        setStatus('error');
        setError({
          code: (serverError?.code as OAuthError['code']) || 'UNKNOWN_ERROR',
          message: serverError?.message || 'Authentication failed. Please try again.',
        });

        // Clean up session storage
        sessionStorage.removeItem('oauth_state');
        sessionStorage.removeItem('oauth_provider');
      }
    }

    handleCallback();
  }, [searchParams, setAuth, navigate]);

  return { status, error };
}

function getErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'access_denied':
      return 'You denied access to your account. Please try again if this was unintentional.';
    case 'invalid_scope':
      return 'The requested permissions were invalid. Please contact support.';
    default:
      return 'An error occurred during authentication. Please try again.';
  }
}
