import { z } from 'zod';

export const createPlanSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(30)
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, and hyphens only'),
  description: z.string().max(500).optional().default(''),
  projectsLimit: z.coerce.number().int().min(-1, 'Use -1 for unlimited'),
  usersLimit: z.coerce.number().int().min(-1, 'Use -1 for unlimited'),
  price: z.coerce.number().min(0, 'Price must be positive'),
  billingCycle: z.enum(['monthly', 'yearly']),
  features: z.string().optional(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export type CreatePlanFormData = z.infer<typeof createPlanSchema>;
