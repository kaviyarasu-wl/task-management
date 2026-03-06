import { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useCompleteOAuth } from '../hooks/useIntegrationMutations';
import { ROUTES } from '@/shared/constants/routes';

export function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const completeOAuth = useCompleteOAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const provider = searchParams.get('provider');

    if (!code || !state || !provider) {
      navigate(ROUTES.SETTINGS_INTEGRATIONS, { replace: true });
      return;
    }

    completeOAuth.mutate(
      { providerId: provider, code, state },
      {
        onSettled: () => {
          navigate(ROUTES.SETTINGS_INTEGRATIONS, { replace: true });
        },
      }
    );
  }, [searchParams, navigate, completeOAuth]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">
          Completing authorization...
        </p>
      </div>
    </div>
  );
}
