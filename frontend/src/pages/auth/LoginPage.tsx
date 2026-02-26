import { LoginForm } from '@/features/auth/components/LoginForm';
import { config } from '@/shared/constants/config';

export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-border bg-background p-8 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-foreground">{config.appName}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to your account
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
