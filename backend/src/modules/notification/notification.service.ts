import { emailQueue, reminderQueue, EmailJobData, ReminderJobData } from '@infrastructure/queue/queues';

/**
 * Notification service — public API for enqueuing notifications.
 * Other modules call this instead of touching queues directly.
 */
export class NotificationService {
  async sendEmail(data: EmailJobData, jobName = 'generic-email'): Promise<void> {
    await emailQueue.add(jobName, data);
  }

  async scheduleReminder(data: ReminderJobData, delayMs: number): Promise<void> {
    await reminderQueue.add('task-reminder', data, { delay: delayMs });
  }

  async cancelReminder(taskId: string): Promise<void> {
    // Remove any pending reminders for this task
    const jobs = await reminderQueue.getJobs(['delayed', 'waiting']);
    for (const job of jobs) {
      if ((job.data as ReminderJobData).taskId === taskId) {
        await job.remove();
      }
    }
  }
}
