import { z } from 'zod';

export const slackConfigSchema = z.object({
  channel: z.string().min(1, 'Channel is required').regex(/^#/, 'Channel must start with #'),
  notifyOnTaskCreate: z.boolean().default(true),
  notifyOnTaskComplete: z.boolean().default(true),
  notifyOnComment: z.boolean().default(false),
});

export const githubConfigSchema = z.object({
  repository: z.string().min(1, 'Repository is required'),
  syncIssues: z.boolean().default(false),
  syncPullRequests: z.boolean().default(false),
  autoLink: z.boolean().default(true),
});

export const jiraConfigSchema = z.object({
  projectKey: z.string().min(1, 'Project key is required').max(10),
  syncDirection: z.enum(['inbound', 'outbound', 'bidirectional']).default('bidirectional'),
  mapStatuses: z.boolean().default(true),
});

export const PROVIDER_CONFIG_SCHEMAS: Record<string, z.ZodSchema> = {
  slack: slackConfigSchema,
  github: githubConfigSchema,
  jira: jiraConfigSchema,
};

export type SlackConfig = z.infer<typeof slackConfigSchema>;
export type GitHubConfig = z.infer<typeof githubConfigSchema>;
export type JiraConfig = z.infer<typeof jiraConfigSchema>;
