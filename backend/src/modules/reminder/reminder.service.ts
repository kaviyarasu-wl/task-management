import { Types } from 'mongoose';
import { RequestContext } from '@core/context/RequestContext';
import { EventBus } from '@core/events/EventBus';
import { emailQueue } from '@infrastructure/queue/queues';
import { Task, ITask } from '@modules/task/task.model';
import { createLogger } from '@infrastructure/logger';

const log = createLogger('ReminderService');
import { User, IUser } from '@modules/user/user.model';
import { ReminderPreference, IReminderPreference } from './reminderPreference.model';
import { TaskReminder, ITaskReminder } from './taskReminder.model';
import {
  ReminderPreferenceRepository,
  TaskReminderRepository,
} from './reminder.repository';

export interface UpdatePreferencesDTO {
  defaultReminders?: number[];
  overdueReminders?: boolean;
  dailyDigest?: boolean;
  digestTime?: string;
  timezone?: string;
}

export class ReminderService {
  private prefRepo: ReminderPreferenceRepository;
  private taskReminderRepo: TaskReminderRepository;

  constructor() {
    this.prefRepo = new ReminderPreferenceRepository();
    this.taskReminderRepo = new TaskReminderRepository();
  }

  /**
   * Schedule reminders for a task based on user preferences.
   * Called when a task is created/updated with a due date.
   */
  async scheduleForTask(
    tenantId: string,
    taskId: string,
    dueDate: Date,
    userId: string
  ): Promise<void> {
    // Get user preferences
    const prefs = await this.getPreferences(tenantId, userId);

    // Delete existing unsent reminders for this task
    await this.taskReminderRepo.deleteByTask(taskId);

    // Schedule reminders based on preferences
    for (const minutesBefore of prefs.defaultReminders) {
      const scheduledFor = new Date(dueDate.getTime() - minutesBefore * 60 * 1000);

      // Only schedule if in the future
      if (scheduledFor > new Date()) {
        await this.taskReminderRepo.create({
          tenantId,
          taskId,
          userId,
          scheduledFor,
          type: 'due_soon',
          minutesBefore,
        });
      }
    }

    // Schedule overdue reminder (1 hour after due)
    if (prefs.overdueReminders) {
      const overdueTime = new Date(dueDate.getTime() + 60 * 60 * 1000);
      if (overdueTime > new Date()) {
        await this.taskReminderRepo.create({
          tenantId,
          taskId,
          userId,
          scheduledFor: overdueTime,
          type: 'overdue',
          minutesBefore: -60, // Negative indicates after due date
        });
      }
    }
  }

  /**
   * Process all due reminders. Called by the reminder worker.
   */
  async processDueReminders(): Promise<number> {
    const dueReminders = await this.taskReminderRepo.findDue();
    let processedCount = 0;

    for (const reminder of dueReminders) {
      try {
        await this.processReminder(reminder);
        processedCount++;
      } catch (error) {
        log.error({ err: error, reminderId: reminder._id }, 'Failed to process reminder');
      }
    }

    return processedCount;
  }

  private async processReminder(reminder: ITaskReminder): Promise<void> {
    // Fetch task
    const task = await Task.findOne({
      _id: reminder.taskId,
      tenantId: reminder.tenantId,
      deletedAt: null,
    })
      .populate('status')
      .exec();

    if (!task) {
      // Task was deleted, clean up reminder
      await this.taskReminderRepo.deleteById(reminder._id.toString());
      return;
    }

    // Check if task is already completed
    const status = task.status as unknown as { category?: string };
    if (status?.category === 'closed') {
      await this.taskReminderRepo.markSent(reminder._id.toString());
      return;
    }

    // Fetch user for email
    const user = await User.findById(reminder.userId).exec();
    if (!user) {
      await this.taskReminderRepo.markSent(reminder._id.toString());
      return;
    }

    const isOverdue = reminder.type === 'overdue';

    // Queue email notification
    await emailQueue.add(
      'send-reminder',
      {
        to: user.email,
        subject: isOverdue
          ? `Task Overdue: ${task.title}`
          : `Task Due Soon: ${task.title}`,
        templateId: 'reminder',
        variables: {
          assigneeName: user.firstName,
          taskTitle: task.title,
          projectName: 'your project',
          dueDate: task.dueDate?.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          isOverdue,
          priority: task.priority,
          taskUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/tasks/${task._id}`,
        },
      },
      { jobId: `reminder-${reminder._id}-${Date.now()}` }
    );

    // Emit notification event for real-time delivery
    await EventBus.emit('notification.created', {
      userId: reminder.userId.toString(),
      tenantId: reminder.tenantId,
      type: isOverdue ? 'task_overdue' : 'task_due_soon',
      title: isOverdue ? 'Task Overdue' : 'Task Due Soon',
      body: task.title,
      data: { taskId: task._id.toString() },
    });

    await this.taskReminderRepo.markSent(reminder._id.toString());
  }

  /**
   * Get reminder preferences for a user, returning defaults if none exist.
   */
  async getPreferences(tenantId: string, userId: string): Promise<IReminderPreference> {
    const existing = await this.prefRepo.findByUser(tenantId, userId);

    if (existing) {
      return existing;
    }

    // Return default preferences (not persisted until user updates)
    return {
      defaultReminders: [60, 1440], // 1 hour, 1 day
      overdueReminders: true,
      dailyDigest: false,
      digestTime: '09:00',
      timezone: 'UTC',
    } as IReminderPreference;
  }

  /**
   * Get preferences using request context
   */
  async getMyPreferences(): Promise<IReminderPreference> {
    const { tenantId, userId } = RequestContext.get();
    return this.getPreferences(tenantId, userId);
  }

  /**
   * Update reminder preferences for a user.
   */
  async updatePreferences(prefs: UpdatePreferencesDTO): Promise<IReminderPreference> {
    const { tenantId, userId } = RequestContext.get();
    return this.prefRepo.upsert(tenantId, userId, prefs);
  }

  /**
   * Get users who have daily digest enabled and it's time to send.
   * Checks against digestTime in their timezone.
   */
  async getUsersWithDigestDue(): Promise<IUser[]> {
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();

    // Find all users with daily digest enabled
    const prefsWithDigest = await ReminderPreference.find({
      dailyDigest: true,
      deletedAt: null,
    }).exec();

    const eligibleUserIds: Types.ObjectId[] = [];

    for (const pref of prefsWithDigest) {
      // Parse digestTime (e.g., "09:00")
      const [hours, minutes] = pref.digestTime.split(':').map(Number);

      // Get timezone offset (simplified - in production use a proper timezone library)
      // For now, we just compare against UTC
      const timezoneOffset = this.getTimezoneOffset(pref.timezone);
      const userLocalHour = (currentHour + timezoneOffset + 24) % 24;

      // Check if it's the right time (within a 5-minute window)
      if (userLocalHour === hours && currentMinute < 5) {
        eligibleUserIds.push(pref.userId);
      }
    }

    if (eligibleUserIds.length === 0) {
      return [];
    }

    // Fetch users
    return User.find({
      _id: { $in: eligibleUserIds },
      deletedAt: null,
    }).exec();
  }

  /**
   * Get tasks due today for a user.
   */
  async getTasksDueToday(
    tenantId: string,
    userId: string
  ): Promise<ITask[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return Task.find({
      tenantId,
      assigneeId: userId,
      dueDate: { $gte: today, $lt: tomorrow },
      deletedAt: null,
    })
      .populate('status')
      .sort({ dueDate: 1 })
      .exec();
  }

  /**
   * Get overdue tasks for a user.
   */
  async getOverdueTasks(
    tenantId: string,
    userId: string
  ): Promise<ITask[]> {
    const now = new Date();

    const tasks = await Task.find({
      tenantId,
      assigneeId: userId,
      dueDate: { $lt: now },
      deletedAt: null,
    })
      .populate('status')
      .sort({ dueDate: 1 })
      .exec();

    // Filter out completed tasks
    return tasks.filter((task) => {
      const status = task.status as unknown as { category?: string };
      return status?.category !== 'closed';
    });
  }

  /**
   * Cancel all reminders for a task (e.g., when task is deleted/completed).
   */
  async cancelTaskReminders(taskId: string): Promise<number> {
    return this.taskReminderRepo.deleteByTask(taskId);
  }

  private getTimezoneOffset(timezone: string): number {
    // Simplified timezone handling - returns offset in hours
    // In production, use a library like luxon or date-fns-tz
    const offsets: Record<string, number> = {
      UTC: 0,
      'America/New_York': -5,
      'America/Los_Angeles': -8,
      'Europe/London': 0,
      'Europe/Paris': 1,
      'Asia/Tokyo': 9,
      'Asia/Kolkata': 5.5,
    };
    return offsets[timezone] ?? 0;
  }
}
