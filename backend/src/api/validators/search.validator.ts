import { z } from 'zod';

export const searchQuerySchema = z.object({
  q: z.string().min(2, 'Query must be at least 2 characters').max(200),
  type: z.enum(['all', 'tasks', 'projects', 'comments']).default('all'),
  projectId: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(10),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
