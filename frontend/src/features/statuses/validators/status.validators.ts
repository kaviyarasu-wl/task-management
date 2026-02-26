import { z } from 'zod';

const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color');

const statusIconSchema = z.enum([
  'circle',
  'circle-dot',
  'loader',
  'clock',
  'eye',
  'check-circle',
  'check-circle-2',
  'x-circle',
  'pause-circle',
  'alert-circle',
  'archive',
  'flag',
  'star',
  'zap',
]);

const statusCategorySchema = z.enum(['open', 'in_progress', 'closed']);

export const createStatusSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  color: hexColorSchema,
  icon: statusIconSchema.optional().default('circle'),
  category: statusCategorySchema,
});

export const updateStatusSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: hexColorSchema.optional(),
  icon: statusIconSchema.optional(),
  category: statusCategorySchema.optional(),
});

export const reorderStatusesSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1, 'At least one status required'),
});

export const updateTransitionsSchema = z.object({
  allowedTransitions: z.array(z.string()),
});

export type CreateStatusFormData = z.infer<typeof createStatusSchema>;
export type UpdateStatusFormData = z.infer<typeof updateStatusSchema>;
export type ReorderStatusesFormData = z.infer<typeof reorderStatusesSchema>;
export type UpdateTransitionsFormData = z.infer<typeof updateTransitionsSchema>;
