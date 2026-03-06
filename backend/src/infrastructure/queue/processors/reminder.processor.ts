import { Job } from 'bullmq';
import { ReminderService } from '@modules/reminder/reminder.service';
import { createLogger } from '@infrastructure/logger';

const log = createLogger('ReminderProcessor');

/**
 * Reminder processor — processes due reminders from the TaskReminder collection.
 * Runs on a schedule and finds all reminders that are due to be sent.
 */
export async function reminderProcessor(job: Job): Promise<void> {
  log.info({ jobId: job.id }, 'Starting reminder check');

  const reminderService = new ReminderService();
  const processedCount = await reminderService.processDueReminders();

  log.info({ jobId: job.id, processedCount }, 'Processed due reminders');
}
