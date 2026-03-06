import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;

export const integrationListSchema = z.object({
  provider: z.enum(['slack', 'github', 'jira', 'linear', 'discord', 'google_calendar']).optional(),
  status: z.enum(['active', 'inactive', 'error', 'pending']).optional(),
});

export const integrationProviderParamSchema = z.object({
  provider: z.enum(['slack', 'github', 'jira', 'linear', 'discord', 'google_calendar']),
});

export const integrationIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid integration ID'),
});

export const integrationConnectSchema = z.object({
  name: z.string().min(1).max(100),
  config: z.record(z.unknown()),
  enabledEvents: z.array(z.string()).min(1).max(50),
});

export const integrationUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  enabledEvents: z.array(z.string()).min(1).max(50).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

// New schemas for frontend-aligned endpoints

export const connectionIdParamSchema = z.object({
  connectionId: z.string().regex(objectIdRegex, 'Invalid connection ID'),
});

export const providerIdParamSchema = z.object({
  providerId: z.enum(['slack', 'github', 'jira', 'linear', 'discord', 'google_calendar']),
});

export const oauthCallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});

export const eventQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const integrationUpdateConfigSchema = z.object({
  config: z.record(z.unknown()),
});
