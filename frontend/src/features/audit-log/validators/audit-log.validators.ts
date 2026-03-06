import { z } from 'zod';

export const auditLogFiltersSchema = z.object({
  userId: z.string().optional(),
  action: z.enum(['create', 'update', 'delete', 'login', 'logout', 'invite', 'role_change']).optional(),
  entityType: z.enum(['task', 'project', 'user', 'tenant', 'status', 'webhook', 'comment']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type AuditLogFiltersFormData = z.infer<typeof auditLogFiltersSchema>;
