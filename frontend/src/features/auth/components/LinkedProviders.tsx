import { Loader2, Link2, Unlink2 } from 'lucide-react';
import { cn, formatDate } from '@/shared/lib/utils';
import {
  useLinkedProviders,
  useLinkProvider,
  useUnlinkProvider,
} from '../hooks/useOAuthProviders';
import type { OAuthProvider } from '../types/oauth.types';

interface ProviderInfo {
  name: string;
  icon: React.ReactNode;
}

const PROVIDER_INFO: Record<OAuthProvider, ProviderInfo> = {
  google: {
    name: 'Google',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
    ),
  },
  github: {
    name: 'GitHub',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    ),
  },
  microsoft: {
    name: 'Microsoft',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="1" y="1" width="10" height="10" fill="#F25022" />
        <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
        <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
        <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
      </svg>
    ),
  },
};

const ALL_PROVIDERS: OAuthProvider[] = ['google', 'github', 'microsoft'];

export function LinkedProviders() {
  const { data: linkedProviders, isLoading } = useLinkedProviders();
  const linkMutation = useLinkProvider();
  const unlinkMutation = useUnlinkProvider();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const linkedProviderMap = new Map(
    (linkedProviders ?? []).map((lp) => [lp.provider, lp])
  );

  return (
    <div className="space-y-3">
      {ALL_PROVIDERS.map((provider) => {
        const linked = linkedProviderMap.get(provider);
        const info = PROVIDER_INFO[provider];
        const isLinked = Boolean(linked);

        return (
          <div
            key={provider}
            className={cn(
              'flex items-center justify-between rounded-lg border p-4',
              isLinked
                ? 'border-border bg-muted/10'
                : 'border-border/50 bg-transparent'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
                {info.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {info.name}
                </p>
                {isLinked && linked ? (
                  <p className="text-xs text-muted-foreground">
                    Connected as {linked.email} &middot;{' '}
                    {formatDate(linked.linkedAt)}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">Not connected</p>
                )}
              </div>
            </div>

            {isLinked ? (
              <button
                onClick={() => unlinkMutation.mutate(provider)}
                disabled={unlinkMutation.isPending}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5',
                  'text-sm text-muted-foreground',
                  'border border-border/50',
                  'hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5',
                  'disabled:opacity-50'
                )}
              >
                <Unlink2 className="h-3.5 w-3.5" />
                Disconnect
              </button>
            ) : (
              <button
                onClick={() => linkMutation.mutate(provider)}
                disabled={linkMutation.isPending}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5',
                  'text-sm text-primary',
                  'border border-primary/30',
                  'hover:bg-primary/5',
                  'disabled:opacity-50'
                )}
              >
                <Link2 className="h-3.5 w-3.5" />
                Connect
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
