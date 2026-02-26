import { z } from 'zod';

export const settingsSchema = z.object({
  maxUsers: z
    .number()
    .min(1, 'Must have at least 1 user')
    .max(10000, 'Maximum 10000 users'),
  maxProjects: z
    .number()
    .min(1, 'Must have at least 1 project')
    .max(10000, 'Maximum 10000 projects'),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;
