import { emailQueue, reminderQueue, EmailJobData, ReminderJobData } from '@infrastructure/queue/queues';
import { NotificationRepository } from './notification.repository';
import { RequestContext } from '@core/context/RequestContext';
import { NotFoundError } from '@core/errors/AppError';
import { EventBus } from '@core/events/EventBus';
import { PaginatedResult } from '../../types';
import { INotification } from './notification.model';
import { INotificationPreference, DEFAULT_CHANNELS, DEFAULT_EVENTS } from './notification-preference.model';

/**
 * Notification service — public API for enqueuing notifications
 * and managing in-app notification records.
 */
export class NotificationService {
  private repo: NotificationRepository;

  constructor() {
    this.repo = new NotificationRepository();
  }

  // ── Email queue methods (existing) ──────────────────────────────

  async sendEmail(data: EmailJobData, jobName = 'generic-email'): Promise<void> {
    await emailQueue.add(jobName, data);
  }

  async scheduleReminder(data: ReminderJobData, delayMs: number): Promise<void> {
    await reminderQueue.add('task-reminder', data, { delay: delayMs });
  }

  async cancelReminder(taskId: string): Promise<void> {
    const jobs = await reminderQueue.getJobs(['delayed', 'waiting']);
    for (const job of jobs) {
      const data = job.data as Record<string, unknown>;
      if (data['taskId'] === taskId) {
        await job.remove();
      }
    }
  }

  // ── In-app notification methods (new) ───────────────────────────

  async listNotifications(
    filters: { cursor?: string; limit?: number; isRead?: boolean; type?: string }
  ): Promise<PaginatedResult<INotification>> {
    const { tenantId, userId } = RequestContext.get();
    return this.repo.findByUser(tenantId, userId, filters);
  }

  async getUnreadCount(): Promise<number> {
    const { tenantId, userId } = RequestContext.get();
    return this.repo.countUnread(tenantId, userId);
  }

  async markAsRead(notificationId: string): Promise<INotification> {
    const { tenantId } = RequestContext.get();
    const notification = await this.repo.markAsRead(tenantId, notificationId);
    if (!notification) throw new NotFoundError('Notification');
    return notification;
  }

  async markAllAsRead(): Promise<number> {
    const { tenantId, userId } = RequestContext.get();
    return this.repo.markAllAsRead(tenantId, userId);
  }

  async deleteNotification(notificationId: string): Promise<void> {
    const { tenantId } = RequestContext.get();
    const deleted = await this.repo.softDelete(tenantId, notificationId);
    if (!deleted) throw new NotFoundError('Notification');
  }

  /**
   * Create an in-app notification. Called by event listeners.
   * Checks user preferences before creating.
   */
  async createInAppNotification(data: {
    tenantId: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    entityType: string;
    entityId: string;
    eventKey: string;
    payload?: Record<string, unknown>;
  }): Promise<INotification | null> {
    const prefs = await this.repo.findPreferences(data.tenantId, data.userId);
    const channels = prefs?.channels ?? DEFAULT_CHANNELS;
    const events = prefs?.events ?? DEFAULT_EVENTS;

    if (!channels.inApp) return null;
    if (events[data.eventKey as keyof typeof events] === false) return null;

    const notification = await this.repo.create({
      tenantId: data.tenantId,
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      entityType: data.entityType,
      entityId: data.entityId,
      data: data.payload,
    });

    await EventBus.emit('notification.created', {
      notificationId: notification._id!.toString(),
      tenantId: data.tenantId,
      userId: data.userId,
    });

    return notification;
  }

  // ── Preferences ─────────────────────────────────────────────────

  async getPreferences(): Promise<INotificationPreference | { channels: typeof DEFAULT_CHANNELS; events: typeof DEFAULT_EVENTS }> {
    const { tenantId, userId } = RequestContext.get();
    const prefs = await this.repo.findPreferences(tenantId, userId);
    return prefs ?? { channels: DEFAULT_CHANNELS, events: DEFAULT_EVENTS };
  }

  async updatePreferences(
    update: {
      channels?: Partial<INotificationPreference['channels']>;
      events?: Partial<INotificationPreference['events']>;
    }
  ): Promise<INotificationPreference> {
    const { tenantId, userId } = RequestContext.get();
    return this.repo.upsertPreferences(tenantId, userId, update);
  }
}
