import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;

export const roleIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid role ID'),
});

export const createRoleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string()).min(1, 'At least one permission required'),
});

export const updateRoleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string()).min(1).optional(),
});
