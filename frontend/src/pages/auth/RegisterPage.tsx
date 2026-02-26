import { RegisterForm } from '@/features/auth/components/RegisterForm';
import { config } from '@/shared/constants/config';

export function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-border bg-background p-8 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-foreground">{config.appName}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your account
            </p>
          </div>
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
