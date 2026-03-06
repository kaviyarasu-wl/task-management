import { useTranslation } from 'react-i18next';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { OAuthButtons } from '@/features/auth/components/OAuthButtons';
import { OAuthDivider } from '@/features/auth/components/OAuthDivider';
import { config } from '@/shared/constants/config';

export function LoginPage() {
  const { t } = useTranslation('auth');

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="glass-panel rounded-2xl border border-white/10 p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-foreground">{config.appName}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('login.subtitle')}
            </p>
          </div>
          <OAuthButtons mode="login" />
          <OAuthDivider className="my-6" />
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
