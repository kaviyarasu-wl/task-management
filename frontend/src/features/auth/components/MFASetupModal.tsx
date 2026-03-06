import { useState, useEffect } from 'react';
import { Modal, ModalFooter } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { OTPInput } from './OTPInput';
import { RecoveryCodes } from './RecoveryCodes';
import { useMFASetup, useMFAVerifySetup } from '../hooks/useMFA';
import { Loader2, QrCode, ShieldCheck } from 'lucide-react';
import { toast } from '@/shared/stores/toastStore';

type SetupStep = 'qr' | 'verify' | 'recovery';

interface MFASetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function MFASetupModal({ isOpen, onClose, onSuccess }: MFASetupModalProps) {
  const [step, setStep] = useState<SetupStep>('qr');
  const [otpValue, setOtpValue] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  const setupMutation = useMFASetup();
  const verifySetupMutation = useMFAVerifySetup();

  // Trigger setup on modal open
  useEffect(() => {
    if (isOpen && !setupMutation.data) {
      setupMutation.mutate();
    }
  }, [isOpen]);

  const handleVerify = () => {
    verifySetupMutation.mutate(otpValue, {
      onSuccess: (response) => {
        setRecoveryCodes(response.data.recoveryCodes);
        setStep('recovery');
      },
      onError: () => {
        toast({ type: 'error', title: 'Invalid code. Please try again.' });
        setOtpValue('');
      },
    });
  };

  const handleRecoveryConfirm = () => {
    toast({ type: 'success', title: 'MFA enabled successfully' });
    resetAndClose();
    onSuccess();
  };

  const resetAndClose = () => {
    setStep('qr');
    setOtpValue('');
    setRecoveryCodes([]);
    setupMutation.reset();
    verifySetupMutation.reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetAndClose}
      title="Set Up Two-Factor Authentication"
      description="Add an extra layer of security to your account"
      size="md"
      closeOnOverlayClick={false}
    >
      {/* Step 1: QR Code */}
      {step === 'qr' && (
        <div className="space-y-4">
          {setupMutation.isPending && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {setupMutation.data && (
            <>
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <QrCode className="h-6 w-6 text-primary" />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Scan this QR code with your authenticator app (Google Authenticator,
                  Authy, 1Password, etc.)
                </p>
              </div>

              <div className="flex justify-center rounded-lg border border-border bg-white p-4">
                <img
                  src={setupMutation.data.data.qrCodeUrl}
                  alt="MFA QR Code"
                  className="h-48 w-48"
                />
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">
                  Can't scan the QR code? Enter this key manually:
                </p>
                <p className="mt-1 select-all font-mono text-sm font-medium text-foreground">
                  {setupMutation.data.data.secret}
                </p>
              </div>
            </>
          )}

          {setupMutation.isError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-center text-sm text-destructive">
              Failed to generate QR code. Please try again.
            </div>
          )}
        </div>
      )}

      {/* Step 2: Verify */}
      {step === 'verify' && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Enter the 6-digit code from your authenticator app to verify setup
            </p>
          </div>

          <OTPInput
            value={otpValue}
            onChange={setOtpValue}
            error={verifySetupMutation.isError}
            disabled={verifySetupMutation.isPending}
          />

          {verifySetupMutation.isError && (
            <p className="text-center text-sm text-destructive">
              Invalid verification code. Please try again.
            </p>
          )}
        </div>
      )}

      {/* Step 3: Recovery Codes */}
      {step === 'recovery' && (
        <RecoveryCodes codes={recoveryCodes} onConfirm={handleRecoveryConfirm} />
      )}

      {/* Footer - not shown on recovery step (RecoveryCodes has its own confirm) */}
      {step !== 'recovery' && (
        <ModalFooter>
          <Button variant="ghost" onClick={resetAndClose}>
            Cancel
          </Button>
          {step === 'qr' && (
            <Button
              onClick={() => setStep('verify')}
              disabled={!setupMutation.data}
            >
              Next
            </Button>
          )}
          {step === 'verify' && (
            <Button
              onClick={handleVerify}
              disabled={otpValue.length !== 6}
              isLoading={verifySetupMutation.isPending}
            >
              Verify
            </Button>
          )}
        </ModalFooter>
      )}
    </Modal>
  );
}
