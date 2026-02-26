import { z } from 'zod';

/** MongoDB ObjectId validation regex */
const objectIdRegex = /^[a-f\d]{24}$/i;

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  projectId: z.string().min(1),
  assigneeId: z.string().optional(),
  status: z.string().regex(objectIdRegex, 'Invalid status ID').optional(), // ObjectId, optional (uses default)
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().date().optional().transform((v) => v ? new Date(v) : undefined),
  tags: z.array(z.string()).max(10).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  assigneeId: z.string().optional(),
  status: z.string().regex(objectIdRegex, 'Invalid status ID').optional(), // ObjectId
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().date().optional().transform((v) => v ? new Date(v) : undefined),
  tags: z.array(z.string()).max(10).optional(),
});

export const taskQuerySchema = z.object({
  projectId: z.string().optional(),
  assigneeId: z.string().optional(),
  status: z.string().regex(objectIdRegex, 'Invalid status ID').optional(), // ObjectId filter
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});
