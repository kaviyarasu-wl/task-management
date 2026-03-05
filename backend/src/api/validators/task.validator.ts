import { z } from 'zod';

/** MongoDB ObjectId validation regex */
const objectIdRegex = /^[a-f\d]{24}$/i;

export const taskIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid task ID'),
});

const recurrenceSchema = z.object({
  type: z.enum(['daily', 'weekly', 'monthly', 'custom']),
  interval: z.number().int().min(1).max(365),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  endDate: z.string().optional(),
  endAfterCount: z.number().int().min(1).max(999).optional(),
}).optional().nullable();

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  projectId: z.string().min(1),
  assigneeId: z.string().regex(objectIdRegex, 'Invalid assignee ID').optional().nullable()
    .transform((v) => v ?? undefined),
  statusId: z.string().regex(objectIdRegex, 'Invalid status ID').optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().date().optional().transform((v) => v ? new Date(v) : undefined),
  tags: z.array(z.string()).max(10).optional(),
  recurrence: recurrenceSchema,
}).transform((data) => {
  const { statusId, ...rest } = data;
  return {
    ...rest,
    status: statusId,
  };
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  assigneeId: z.string().regex(objectIdRegex, 'Invalid assignee ID').optional().nullable()
    .transform((v) => v ?? undefined),
  statusId: z.string().regex(objectIdRegex, 'Invalid status ID').optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().date().optional().transform((v) => v ? new Date(v) : undefined),
  tags: z.array(z.string()).max(10).optional(),
  recurrence: recurrenceSchema,
}).transform((data) => {
  const { statusId, ...rest } = data;
  return {
    ...rest,
    status: statusId,
  };
});

export const taskQuerySchema = z.object({
  projectId: z.string().optional(),
  assigneeId: z.string().optional(),
  statusId: z.string().regex(objectIdRegex, 'Invalid status ID').optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(500).optional(),
}).transform((data) => {
  const { statusId, ...rest } = data;
  return {
    ...rest,
    status: statusId,
  };
});
