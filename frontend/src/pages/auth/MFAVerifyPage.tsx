import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { OTPInput } from '@/features/auth/components/OTPInput';
import { Button } from '@/shared/components/ui/Button';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useMFAVerify, useMFARecovery } from '@/features/auth/hooks/useMFA';
import { pageVariants } from '@/shared/lib/motion';
import { ROUTES } from '@/shared/constants/routes';
import { toast } from '@/shared/stores/toastStore';
import type { UserRole } from '@/shared/types/api.types';
import { cn } from '@/shared/lib/utils';

export function MFAVerifyPage() {
  const navigate = useNavigate();
  const mfaToken = useAuthStore((state) => state.mfaToken);
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearMfaRequired = useAuthStore((state) => state.clearMfaRequired);

  const [mode, setMode] = useState<'otp' | 'recovery'>('otp');
  const [otpValue, setOtpValue] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');

  const verifyMutation = useMFAVerify();
  const recoveryMutation = useMFARecovery();

  // Redirect to login if no MFA token present
  if (!mfaToken) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  const handleAuthenticated = (data: {
    user: {
      _id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      tenantId: string;
    };
    accessToken: string;
    refreshToken: string;
  }) => {
    clearMfaRequired();
    setAuth(
      {
        _id: data.user._id,
        email: data.user.email,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        role: data.user.role as UserRole,
        tenantId: data.user.tenantId,
        isEmailVerified: false,
        createdAt: '',
        updatedAt: '',
      },
      data.accessToken,
      data.refreshToken
    );
    navigate('/dashboard');
  };

  const handleOTPSubmit = () => {
    verifyMutation.mutate(
      { mfaToken, code: otpValue },
      {
        onSuccess: (response) => handleAuthenticated(response.data),
        onError: () => {
          toast({ type: 'error', title: 'Invalid verification code' });
          setOtpValue('');
        },
      }
    );
  };

  const handleRecoverySubmit = () => {
    recoveryMutation.mutate(
      { mfaToken, recoveryCode },
      {
        onSuccess: (response) => handleAuthenticated(response.data),
        onError: () => {
          toast({ type: 'error', title: 'Invalid recovery code' });
          setRecoveryCode('');
        },
      }
    );
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="mx-auto w-full max-w-sm space-y-6"
    >
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <ShieldCheck className="h-7 w-7 text-primary" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-foreground">
          Two-Factor Authentication
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === 'otp'
            ? 'Enter the 6-digit code from your authenticator app'
            : 'Enter one of your recovery codes'}
        </p>
      </div>

      {mode === 'otp' ? (
        <div className="space-y-4">
          <OTPInput
            value={otpValue}
            onChange={setOtpValue}
            error={verifyMutation.isError}
            disabled={verifyMutation.isPending}
          />
          <Button
            className="w-full"
            onClick={handleOTPSubmit}
            disabled={otpValue.length !== 6}
            isLoading={verifyMutation.isPending}
          >
            Verify
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label htmlFor="recoveryCode" className="block text-sm font-medium text-foreground">
              Recovery Code
            </label>
            <input
              id="recoveryCode"
              type="text"
              value={recoveryCode}
              onChange={(e) => setRecoveryCode(e.target.value)}
              placeholder="xxxx-xxxx-xxxx"
              className={cn(
                'mt-1 block w-full rounded-xl border border-border/50 px-3 py-2',
                'bg-background/50 dark:bg-background/30',
                'backdrop-blur-sm',
                'focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/50',
                'placeholder:text-muted-foreground/50',
                'font-mono'
              )}
            />
          </div>
          <Button
            className="w-full"
            onClick={handleRecoverySubmit}
            disabled={!recoveryCode.trim()}
            isLoading={recoveryMutation.isPending}
          >
            Verify Recovery Code
          </Button>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setMode(mode === 'otp' ? 'recovery' : 'otp');
          setOtpValue('');
          setRecoveryCode('');
          verifyMutation.reset();
          recoveryMutation.reset();
        }}
        className="block w-full text-center text-sm text-primary hover:underline"
      >
        {mode === 'otp'
          ? 'Use a recovery code instead'
          : 'Use authenticator app instead'}
      </button>
    </motion.div>
  );
}
