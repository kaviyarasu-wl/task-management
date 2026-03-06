import { z } from 'zod';

/** MongoDB ObjectId validation regex */
const objectIdRegex = /^[a-f\d]{24}$/i;

export const timeEntryIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid time entry ID'),
});

export const taskIdParamSchema = z.object({
  taskId: z.string().regex(objectIdRegex, 'Invalid task ID'),
});

export const startTimerSchema = z.object({
  taskId: z.string().regex(objectIdRegex, 'Invalid task ID'),
  description: z.string().max(500).optional(),
});

export const createManualEntrySchema = z.object({
  taskId: z.string().regex(objectIdRegex, 'Invalid task ID'),
  description: z.string().max(500).optional(),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime(),
  durationMinutes: z.number().min(1).max(1440), // Max 24 hours
  billable: z.boolean().default(false),
});

export const updateTimeEntrySchema = z.object({
  description: z.string().max(500).optional(),
  billable: z.boolean().optional(),
  durationMinutes: z.number().min(1).max(1440).optional(),
});

export const timeEntryQuerySchema = z.object({
  taskId: z.string().regex(objectIdRegex, 'Invalid task ID').optional(),
  userId: z.string().regex(objectIdRegex, 'Invalid user ID').optional(),
  startedAfter: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), 'Invalid date')
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  startedBefore: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), 'Invalid date')
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  billable: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

export const userIdQuerySchema = z.object({
  userId: z.string().regex(objectIdRegex, 'Invalid user ID').optional(),
});
