import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;

export const notificationIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid notification ID'),
});

export const notificationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  isRead: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  type: z.string().optional(),
});

export const updatePreferencesSchema = z.object({
  channels: z
    .object({
      inApp: z.boolean().optional(),
      email: z.boolean().optional(),
    })
    .optional(),
  events: z
    .object({
      taskAssigned: z.boolean().optional(),
      taskCompleted: z.boolean().optional(),
      commentMention: z.boolean().optional(),
      userInvited: z.boolean().optional(),
      projectUpdated: z.boolean().optional(),
      taskDueSoon: z.boolean().optional(),
    })
    .optional(),
});
