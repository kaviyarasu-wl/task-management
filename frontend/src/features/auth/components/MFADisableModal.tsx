import { useState } from 'react';
import { Modal, ModalFooter } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { OTPInput } from './OTPInput';
import { useMFADisable } from '../hooks/useMFA';
import { ShieldOff } from 'lucide-react';
import { toast } from '@/shared/stores/toastStore';

interface MFADisableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function MFADisableModal({ isOpen, onClose, onSuccess }: MFADisableModalProps) {
  const [otpValue, setOtpValue] = useState('');
  const disableMutation = useMFADisable();

  const handleDisable = () => {
    disableMutation.mutate(otpValue, {
      onSuccess: () => {
        toast({ type: 'success', title: 'MFA has been disabled' });
        resetAndClose();
        onSuccess();
      },
      onError: () => {
        toast({ type: 'error', title: 'Invalid code. Please try again.' });
        setOtpValue('');
      },
    });
  };

  const resetAndClose = () => {
    setOtpValue('');
    disableMutation.reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetAndClose}
      title="Disable Two-Factor Authentication"
      description="Enter your authenticator code to confirm"
      size="sm"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
          <ShieldOff className="h-5 w-5 shrink-0 text-destructive" />
          <div className="text-sm text-foreground">
            <p className="font-medium">This will reduce your account security</p>
            <p className="mt-1 text-muted-foreground">
              You will no longer be required to enter a verification code when signing in.
            </p>
          </div>
        </div>

        <OTPInput
          value={otpValue}
          onChange={setOtpValue}
          error={disableMutation.isError}
          disabled={disableMutation.isPending}
        />

        {disableMutation.isError && (
          <p className="text-center text-sm text-destructive">
            Invalid verification code. Please try again.
          </p>
        )}
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={resetAndClose}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={handleDisable}
          disabled={otpValue.length !== 6}
          isLoading={disableMutation.isPending}
        >
          Disable MFA
        </Button>
      </ModalFooter>
    </Modal>
  );
}
