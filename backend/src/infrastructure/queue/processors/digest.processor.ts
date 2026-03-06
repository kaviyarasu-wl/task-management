import { Job } from 'bullmq';
import { ReminderService } from '@modules/reminder/reminder.service';
import { emailQueue } from '../queues';
import { createLogger } from '@infrastructure/logger';

const log = createLogger('DigestProcessor');

/**
 * Daily digest processor — sends digest emails to users who have enabled
 * daily digest and whose local time matches their configured digest time.
 */
export async function digestProcessor(job: Job): Promise<void> {
  log.info({ jobId: job.id }, 'Starting daily digest check');

  const reminderService = new ReminderService();

  // Find users who have digest enabled and it's time to send
  const usersWithDigest = await reminderService.getUsersWithDigestDue();

  log.info({ userCount: usersWithDigest.length }, 'Found users for digest');

  for (const user of usersWithDigest) {
    try {
      // Get tasks due today
      const dueToday = await reminderService.getTasksDueToday(
        user.tenantId,
        user._id.toString()
      );

      // Get overdue tasks
      const overdue = await reminderService.getOverdueTasks(
        user.tenantId,
        user._id.toString()
      );

      if (dueToday.length === 0 && overdue.length === 0) {
        log.debug({ userId: user._id }, 'No tasks to report for user');
        continue;
      }

      const today = new Date();

      // Format tasks for email
      const dueTodayFormatted = dueToday.map((task) => ({
        title: task.title,
        priority: task.priority,
        dueTime: task.dueDate?.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/tasks/${task._id}`,
      }));

      const overdueFormatted = overdue.map((task) => ({
        title: task.title,
        priority: task.priority,
        dueDate: task.dueDate?.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        daysOverdue: Math.floor(
          (today.getTime() - (task.dueDate?.getTime() || 0)) / (1000 * 60 * 60 * 24)
        ),
        url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/tasks/${task._id}`,
      }));

      await emailQueue.add(
        'send-digest',
        {
          to: user.email,
          subject: `Daily Task Digest - ${today.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}`,
          templateId: 'daily-digest',
          variables: {
            userName: user.firstName,
            date: today.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            dueToday: dueTodayFormatted,
            dueTodayCount: dueToday.length,
            overdue: overdueFormatted,
            overdueCount: overdue.length,
            dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`,
          },
        },
        { jobId: `digest-${user._id}-${today.toISOString().split('T')[0]}` }
      );

      log.info({ userId: user._id }, 'Queued digest email');
    } catch (error) {
      log.error({ err: error, userId: user._id }, 'Failed to send digest');
    }
  }

  log.info({ jobId: job.id }, 'Daily digest check completed');
}
