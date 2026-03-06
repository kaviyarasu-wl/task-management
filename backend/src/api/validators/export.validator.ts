import { z } from 'zod';

/** MongoDB ObjectId validation regex */
const objectIdRegex = /^[a-f\d]{24}$/i;

/** ISO date string validation */
const isoDateString = z.string().refine((val) => !isNaN(Date.parse(val)), {
  message: 'Invalid date format',
});

/**
 * Export query schema for download endpoints
 */
export const exportQuerySchema = z.object({
  format: z.enum(['csv', 'json', 'pdf', 'xlsx']).default('csv'),
  projectId: z.string().regex(objectIdRegex, 'Invalid project ID').optional(),
  start: isoDateString.optional(),
  end: isoDateString.optional(),
  async: z.coerce.boolean().default(false),
});

/**
 * Scheduled report creation schema
 */
export const scheduledReportCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  reportType: z.enum([
    'task-metrics',
    'user-productivity',
    'team-workload',
    'project-summary',
    'velocity',
  ]),
  format: z.enum(['csv', 'json', 'pdf', 'xlsx']).default('csv'),
  cronExpression: z
    .string()
    .min(9, 'Invalid cron expression')
    .max(100, 'Cron expression too long')
    .refine(
      (val) => {
        // Basic cron format validation (5 or 6 fields)
        const fields = val.trim().split(/\s+/);
        return fields.length >= 5 && fields.length <= 6;
      },
      { message: 'Invalid cron expression format' }
    ),
  timezone: z.string().default('UTC'),
  recipients: z
    .array(z.string().email('Invalid email address'))
    .min(1, 'At least one recipient is required')
    .max(10, 'Maximum 10 recipients allowed'),
  filters: z
    .object({
      projectId: z.string().regex(objectIdRegex, 'Invalid project ID').optional(),
      dateRange: z
        .enum(['last_7_days', 'last_30_days', 'this_month', 'last_month'])
        .optional(),
    })
    .optional(),
});

/**
 * Scheduled report update schema
 */
export const scheduledReportUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  cronExpression: z
    .string()
    .min(9)
    .max(100)
    .refine(
      (val) => {
        const fields = val.trim().split(/\s+/);
        return fields.length >= 5 && fields.length <= 6;
      },
      { message: 'Invalid cron expression format' }
    )
    .optional(),
  timezone: z.string().optional(),
  recipients: z.array(z.string().email()).min(1).max(10).optional(),
  filters: z
    .object({
      projectId: z.string().regex(objectIdRegex).optional(),
      dateRange: z.enum(['last_7_days', 'last_30_days', 'this_month', 'last_month']).optional(),
    })
    .optional(),
  isActive: z.boolean().optional(),
});

/**
 * Scheduled report ID parameter schema
 */
export const scheduledReportIdSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid scheduled report ID'),
});

export type ExportQueryInput = z.infer<typeof exportQuerySchema>;
export type ScheduledReportCreateInput = z.infer<typeof scheduledReportCreateSchema>;
export type ScheduledReportUpdateInput = z.infer<typeof scheduledReportUpdateSchema>;
export type ScheduledReportIdInput = z.infer<typeof scheduledReportIdSchema>;
