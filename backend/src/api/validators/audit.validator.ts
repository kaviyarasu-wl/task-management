import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;

export const auditIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid audit log ID'),
});

export const auditQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  userId: z.string().regex(objectIdRegex, 'Invalid user ID').optional(),
  action: z.string().optional(),
  entityType: z.enum([
    'task', 'project', 'user', 'role', 'comment', 'status',
    'invitation', 'tenant', 'webhook', 'apiKey', 'settings',
  ]).optional(),
  entityId: z.string().optional(),
  dateFrom: z.string().datetime().optional().transform((v) => v ? new Date(v) : undefined),
  dateTo: z.string().datetime().optional().transform((v) => v ? new Date(v) : undefined),
});

export const auditExportQuerySchema = auditQuerySchema.extend({
  format: z.enum(['csv']).default('csv'),
});
