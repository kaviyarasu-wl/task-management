import { Queue } from 'bullmq';
import { getRedisClient } from '../redis/client';

const connection = () => getRedisClient();

// Each queue has its own retry strategy
export const emailQueue = new Queue('email', {
  connection: connection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 }, // 2s, 4s, 8s
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 }, // Keep failed jobs for debugging
  },
});

export const reminderQueue = new Queue('reminders', {
  connection: connection(),
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 200 },
  },
});

export const recurrenceQueue = new Queue('recurrence', {
  connection: connection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
  },
});

export interface EmailAttachmentData {
  filename: string;
  content: string;
  encoding?: string;
  contentType?: string;
}

export type EmailJobData = {
  to: string;
  subject: string;
  templateId: string;
  variables: Record<string, unknown>;
  attachment?: EmailAttachmentData;
};

export type ReminderJobData = {
  // Empty - the reminder processor fetches due reminders from DB
  // This job type just triggers the check
  triggeredAt?: string;
};

export type RecurrenceJobData = {
  // Empty - the recurrence processor fetches due recurrences from DB
  // This job type just triggers the check
  triggeredAt?: string;
};

export const digestQueue = new Queue('digest', {
  connection: connection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 100 },
  },
});

export type DigestJobData = {
  // Empty - the digest processor finds users whose digest time matches
  triggeredAt?: string;
};

export const scheduledReportQueue = new Queue('scheduled-reports', {
  connection: connection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 200 },
  },
});

export type ScheduledReportJobData = {
  // Empty - the processor fetches due scheduled reports from DB
  triggeredAt?: string;
};

export const webhookQueue = new Queue('webhooks', {
  connection: connection(),
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 60000 }, // 1min, 2min, 4min, 8min, 16min
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 300 }, // Keep more failed webhooks for debugging
  },
});

export type WebhookJobData = {
  deliveryId: string;
  tenantId: string;
};

export const exportQueue = new Queue('exports', {
  connection: connection(),
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 10000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 100 },
  },
});

export type ExportJobData = {
  tenantId: string;
  userId: string;
  reportType: string;
  format: string;
  filters?: Record<string, unknown>;
  dateRange?: { start: string; end: string };
  recipientEmail: string;
};

export const auditCleanupQueue = new Queue('audit-cleanup', {
  connection: connection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 30000 },
    removeOnComplete: { count: 10 },
    removeOnFail: { count: 50 },
  },
});

export type AuditCleanupJobData = {
  triggeredAt?: string;
};

export const integrationQueue = new Queue('integrations', {
  connection: connection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 300 },
  },
});

export type IntegrationJobData = {
  integrationId: string;
  event: string;
  payload: Record<string, unknown>;
  tenantId: string;
};
