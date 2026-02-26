import { z } from 'zod';

export const updateSettingsSchema = z.object({
  maxUsers: z.number().min(1).max(10000).optional(),
  maxProjects: z.number().min(1).max(10000).optional(),
  allowedPlugins: z.array(z.string()).optional(),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['admin', 'member', 'viewer']),
});
