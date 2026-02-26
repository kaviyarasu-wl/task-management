import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(100, 'Project name must be less than 100 characters'),
  description: z
    .string()
    .max(2000, 'Description must be less than 2000 characters')
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
    .optional(),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  isArchived: z.boolean().optional(),
});

export type CreateProjectFormData = z.infer<typeof createProjectSchema>;
export type UpdateProjectFormData = z.infer<typeof updateProjectSchema>;
