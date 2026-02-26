import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code (e.g. #FF5733)')
    .optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).optional(),
  isArchived: z.boolean().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
});

export const projectQuerySchema = z.object({
  includeArchived: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});
