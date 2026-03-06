import { Link } from 'react-router-dom';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';
import { fadeVariants } from '@/shared/lib/motion';
import { useOAuthCallback } from '@/features/auth/hooks/useOAuthCallback';
import { ROUTES } from '@/shared/constants/routes';

export function OAuthCallbackPage() {
  const { status, error } = useOAuthCallback();

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <motion.div
        variants={fadeVariants}
        initial="initial"
        animate="animate"
        className="w-full max-w-sm text-center"
      >
        {status === 'loading' && (
          <div className="space-y-4">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <div>
              <p className="text-lg font-medium text-foreground">
                Completing sign in...
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Please wait while we verify your account.
              </p>
            </div>
          </div>
        )}

        {status === 'error' && error && (
          <div className="space-y-6">
            <div
              className={cn(
                'mx-auto flex h-16 w-16 items-center justify-center',
                'rounded-full bg-destructive/10'
              )}
            >
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <p className="text-lg font-medium text-foreground">
                Authentication Failed
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {error.message}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link
                to={ROUTES.LOGIN}
                className={cn(
                  'inline-flex items-center justify-center gap-2',
                  'rounded-xl px-4 py-2.5',
                  'bg-primary text-primary-foreground',
                  'text-sm font-medium',
                  'hover:bg-primary/90'
                )}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </Link>
              <Link
                to={ROUTES.REGISTER}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Create a new account
              </Link>
            </div>
          </div>
        )}

        {/* Success is handled by redirect in the hook -- this is a brief flash */}
        {status === 'success' && (
          <div className="space-y-4">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Redirecting to dashboard...
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
