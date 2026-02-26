import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
  projectId: z.string().min(1, 'Project is required'),
  statusId: z.string().optional(), // Status ID, optional for create (uses default)
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  dueDate: z.string().optional(),
  tags: z.string().optional(),
});

export type CreateTaskFormData = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = createTaskSchema.partial().extend({
  statusId: z.string().optional(), // Status ID for updates
  assigneeId: z.string().optional(),
});

export type UpdateTaskFormData = z.infer<typeof updateTaskSchema>;
