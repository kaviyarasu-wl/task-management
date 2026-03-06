import { z } from 'zod';

export const mfaVerifySetupSchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits').regex(/^\d+$/, 'Code must be numeric'),
});

export const mfaVerifyLoginSchema = z.object({
  mfaToken: z.string().min(1, 'MFA token is required'),
  code: z.string().length(6, 'Code must be 6 digits').regex(/^\d+$/, 'Code must be numeric'),
});

export const mfaRecoverySchema = z.object({
  mfaToken: z.string().min(1, 'MFA token is required'),
  recoveryCode: z.string().min(1, 'Recovery code is required'),
});

export const mfaDisableSchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits').regex(/^\d+$/, 'Code must be numeric'),
});
