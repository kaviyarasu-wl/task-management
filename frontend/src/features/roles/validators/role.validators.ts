import { z } from 'zod';

export const roleFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Role name is required')
    .max(50, 'Role name must be under 50 characters')
    .regex(
      /^[a-zA-Z0-9\s_-]+$/,
      'Role name can only contain letters, numbers, spaces, hyphens, and underscores'
    ),
  description: z
    .string()
    .max(200, 'Description must be under 200 characters')
    .optional()
    .or(z.literal('')),
  permissions: z
    .array(z.string())
    .min(1, 'At least one permission is required'),
});

export type RoleFormData = z.infer<typeof roleFormSchema>;
