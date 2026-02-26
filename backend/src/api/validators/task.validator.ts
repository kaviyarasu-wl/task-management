import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  projectId: z.string().min(1),
  assigneeId: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().date().optional().transform((v) => v ? new Date(v) : undefined),
  tags: z.array(z.string()).max(10).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  assigneeId: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().date().optional().transform((v) => v ? new Date(v) : undefined),
  tags: z.array(z.string()).max(10).optional(),
});

export const taskQuerySchema = z.object({
  projectId: z.string().optional(),
  assigneeId: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});
