import { z } from 'zod';
import { StatusCategory, StatusIcon } from '../../types/status.types';

/** Allowed status icon names */
const STATUS_ICONS: StatusIcon[] = [
  'circle',
  'circle-dot',
  'circle-check',
  'circle-x',
  'circle-pause',
  'clock',
  'hourglass',
  'loader',
  'play',
  'pause',
  'check',
  'x',
  'alert-circle',
  'ban',
  'archive',
  'flag',
  'star',
  'zap',
  'rocket',
  'target',
  'eye',
  'eye-off',
  'thumbs-up',
  'thumbs-down',
];

/** Allowed status categories */
const STATUS_CATEGORIES: StatusCategory[] = ['open', 'in_progress', 'closed'];

/** Hex color regex pattern */
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

/** MongoDB ObjectId regex pattern */
const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

/**
 * Schema for creating a new status.
 */
export const createStatusSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name cannot exceed 50 characters')
    .trim(),
  slug: z
    .string()
    .max(60, 'Slug cannot exceed 60 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional(),
  color: z
    .string()
    .regex(HEX_COLOR_REGEX, 'Color must be a valid hex code (e.g., #FF5733)'),
  icon: z.enum(STATUS_ICONS as [StatusIcon, ...StatusIcon[]]).optional(),
  category: z.enum(STATUS_CATEGORIES as [StatusCategory, ...StatusCategory[]], {
    errorMap: () => ({ message: 'Category must be: open, in_progress, or closed' }),
  }),
  order: z.number().int().min(0, 'Order must be non-negative').optional(),
  allowedTransitions: z
    .array(z.string().regex(OBJECT_ID_REGEX, 'Invalid status ID format'))
    .optional(),
  isDefault: z.boolean().optional(),
});

/**
 * Schema for updating an existing status.
 */
export const updateStatusSchema = z.object({
  name: z
    .string()
    .min(1, 'Name cannot be empty')
    .max(50, 'Name cannot exceed 50 characters')
    .trim()
    .optional(),
  slug: z
    .string()
    .max(60, 'Slug cannot exceed 60 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional(),
  color: z
    .string()
    .regex(HEX_COLOR_REGEX, 'Color must be a valid hex code (e.g., #FF5733)')
    .optional(),
  icon: z.enum(STATUS_ICONS as [StatusIcon, ...StatusIcon[]]).optional(),
  category: z
    .enum(STATUS_CATEGORIES as [StatusCategory, ...StatusCategory[]])
    .optional(),
  order: z.number().int().min(0, 'Order must be non-negative').optional(),
  allowedTransitions: z
    .array(z.string().regex(OBJECT_ID_REGEX, 'Invalid status ID format'))
    .optional(),
  isDefault: z.boolean().optional(),
});

/**
 * Schema for reordering statuses.
 */
export const reorderStatusSchema = z.object({
  orderedIds: z
    .array(z.string().regex(OBJECT_ID_REGEX, 'Invalid status ID format'))
    .min(1, 'At least one status ID is required'),
});

/**
 * Schema for status ID path parameter.
 */
export const statusIdParamSchema = z.object({
  id: z.string().regex(OBJECT_ID_REGEX, 'Invalid status ID format'),
});

/**
 * Schema for updating allowed transitions for a status.
 */
export const updateTransitionsSchema = z.object({
  allowedTransitions: z
    .array(z.string().regex(OBJECT_ID_REGEX, 'Invalid status ID format'))
    .default([]),
});

/** Type exports for controller usage */
export type CreateStatusInput = z.infer<typeof createStatusSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type ReorderStatusInput = z.infer<typeof reorderStatusSchema>;
export type UpdateTransitionsInput = z.infer<typeof updateTransitionsSchema>;
