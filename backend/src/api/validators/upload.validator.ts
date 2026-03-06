import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;

export const uploadBodySchema = z.object({
  entityType: z.enum(['task', 'comment']),
  entityId: z.string().regex(objectIdRegex, 'Invalid entity ID'),
});

export const uploadQuerySchema = z.object({
  entityType: z.enum(['task', 'comment']),
  entityId: z.string().regex(objectIdRegex, 'Invalid entity ID'),
});

export const uploadIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid upload ID'),
});
