import { z } from 'zod';

export const otpSchema = z.object({
  code: z
    .string()
    .length(6, 'Code must be exactly 6 digits')
    .regex(/^\d{6}$/, 'Code must contain only digits'),
});

export const recoveryCodeSchema = z.object({
  recoveryCode: z
    .string()
    .min(1, 'Recovery code is required')
    .regex(/^[a-zA-Z0-9-]+$/, 'Invalid recovery code format'),
});

export type OTPFormData = z.infer<typeof otpSchema>;
export type RecoveryCodeFormData = z.infer<typeof recoveryCodeSchema>;
