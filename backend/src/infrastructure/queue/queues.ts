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

export type EmailJobData = {
  to: string;
  subject: string;
  templateId: string;
  variables: Record<string, unknown>;
};

export type ReminderJobData = {
  taskId: string;
  tenantId: string;
  assigneeEmail: string;
  taskTitle: string;
  dueDate: string;
};
