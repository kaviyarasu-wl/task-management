import { z } from 'zod';

export const oauthProviderParamSchema = z.object({
  provider: z.enum(['google', 'github', 'microsoft']),
});

export const oauthRedirectQuerySchema = z.object({
  tenantSlug: z.string().optional(),
  inviteToken: z.string().optional(),
  action: z.enum(['login', 'register']).optional(),
});

export const oauthCallbackQuerySchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().min(1, 'State parameter is required'),
});

export const oauthLinkBodySchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  redirectUri: z.string().url('Must be a valid URL'),
});
