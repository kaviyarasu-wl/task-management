import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;

export const savedViewListSchema = z.object({
  entityType: z.enum(['tasks', 'projects']).optional(),
});

const filtersSchema = z
  .object({
    projectId: z.string().regex(objectIdRegex).optional(),
    assigneeId: z.string().optional(),
    status: z.string().regex(objectIdRegex).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    tags: z.array(z.string()).optional(),
    dueDateFrom: z.coerce.date().optional(),
    dueDateTo: z.coerce.date().optional(),
    search: z.string().max(200).optional(),
  })
  .optional()
  .default({});

export const createSavedViewSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  entityType: z.enum(['tasks', 'projects']),
  filters: filtersSchema,
  sortBy: z.string().max(50).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  isShared: z.boolean().default(false),
});

export const updateSavedViewSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  filters: filtersSchema.optional(),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  isShared: z.boolean().optional(),
});

export const savedViewIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid saved view ID'),
});

export const setDefaultSchema = z.object({
  isDefault: z.boolean(),
});
