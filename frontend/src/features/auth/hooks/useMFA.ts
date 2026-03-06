import { useMutation } from '@tanstack/react-query';
import { authApi } from '../services/authApi';

export function useMFASetup() {
  return useMutation({
    mutationFn: () => authApi.mfaSetup(),
  });
}

export function useMFAVerifySetup() {
  return useMutation({
    mutationFn: (code: string) => authApi.mfaVerifySetup(code),
  });
}

export function useMFAVerify() {
  return useMutation({
    mutationFn: ({ mfaToken, code }: { mfaToken: string; code: string }) =>
      authApi.mfaVerify(mfaToken, code),
  });
}

export function useMFARecovery() {
  return useMutation({
    mutationFn: ({
      mfaToken,
      recoveryCode,
    }: {
      mfaToken: string;
      recoveryCode: string;
    }) => authApi.mfaRecovery(mfaToken, recoveryCode),
  });
}

export function useMFADisable() {
  return useMutation({
    mutationFn: (code: string) => authApi.mfaDisable(code),
  });
}
