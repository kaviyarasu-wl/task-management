import { Types } from 'mongoose';
import { Notification, INotification } from './notification.model';
import {
  NotificationPreference,
  INotificationPreference,
  DEFAULT_CHANNELS,
  DEFAULT_EVENTS,
} from './notification-preference.model';
import { PaginatedResult } from '../../types';

export interface NotificationFilters {
  isRead?: boolean;
  type?: string;
  cursor?: string;
  limit?: number;
}

export class NotificationRepository {
  // ── Notifications ───────────────────────────────────────────────

  async findByUser(
    tenantId: string,
    userId: string,
    filters: NotificationFilters
  ): Promise<PaginatedResult<INotification>> {
    const limit = Math.min(filters.limit ?? 20, 100);
    const query: Record<string, unknown> = {
      tenantId,
      userId: new Types.ObjectId(userId),
      deletedAt: null,
    };

    if (filters.isRead !== undefined) query['isRead'] = filters.isRead;
    if (filters.type) query['type'] = filters.type;
    if (filters.cursor) query['_id'] = { $lt: new Types.ObjectId(filters.cursor) };

    const data = await Notification.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean()
      .exec();

    const hasMore = data.length > limit;
    if (hasMore) data.pop();

    const total = await Notification.countDocuments({
      tenantId,
      userId: new Types.ObjectId(userId),
      deletedAt: null,
    }).exec();

    return {
      data: data as unknown as INotification[],
      nextCursor: hasMore ? (data[data.length - 1]._id?.toString() ?? null) : null,
      total,
    };
  }

  async countUnread(tenantId: string, userId: string): Promise<number> {
    return Notification.countDocuments({
      tenantId,
      userId: new Types.ObjectId(userId),
      isRead: false,
      deletedAt: null,
    }).exec();
  }

  async markAsRead(tenantId: string, notificationId: string): Promise<INotification | null> {
    return Notification.findOneAndUpdate(
      { _id: notificationId, tenantId, deletedAt: null },
      { isRead: true, readAt: new Date() },
      { new: true }
    ).exec();
  }

  async markAllAsRead(tenantId: string, userId: string): Promise<number> {
    const result = await Notification.updateMany(
      {
        tenantId,
        userId: new Types.ObjectId(userId),
        isRead: false,
        deletedAt: null,
      },
      { isRead: true, readAt: new Date() }
    ).exec();
    return result.modifiedCount;
  }

  async create(data: {
    tenantId: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    entityType: string;
    entityId: string;
    data?: Record<string, unknown>;
  }): Promise<INotification> {
    const notification = new Notification({
      tenantId: data.tenantId,
      userId: new Types.ObjectId(data.userId),
      type: data.type,
      title: data.title,
      message: data.message,
      entityType: data.entityType,
      entityId: new Types.ObjectId(data.entityId),
      data: data.data ?? {},
    });
    return notification.save();
  }

  async softDelete(tenantId: string, notificationId: string): Promise<boolean> {
    const result = await Notification.findOneAndUpdate(
      { _id: notificationId, tenantId, deletedAt: null },
      { deletedAt: new Date() }
    ).exec();
    return result !== null;
  }

  // ── Preferences ─────────────────────────────────────────────────

  async findPreferences(
    tenantId: string,
    userId: string
  ): Promise<INotificationPreference | null> {
    return NotificationPreference.findOne({
      tenantId,
      userId: new Types.ObjectId(userId),
      deletedAt: null,
    }).exec();
  }

  async upsertPreferences(
    tenantId: string,
    userId: string,
    update: {
      channels?: Partial<INotificationPreference['channels']>;
      events?: Partial<INotificationPreference['events']>;
    }
  ): Promise<INotificationPreference> {
    const setFields: Record<string, unknown> = {};
    if (update.channels) {
      for (const [key, val] of Object.entries(update.channels)) {
        setFields[`channels.${key}`] = val;
      }
    }
    if (update.events) {
      for (const [key, val] of Object.entries(update.events)) {
        setFields[`events.${key}`] = val;
      }
    }

    return NotificationPreference.findOneAndUpdate(
      { tenantId, userId: new Types.ObjectId(userId), deletedAt: null },
      {
        $set: setFields,
        $setOnInsert: {
          tenantId,
          userId: new Types.ObjectId(userId),
          channels: DEFAULT_CHANNELS,
          events: DEFAULT_EVENTS,
        },
      },
      { new: true, upsert: true }
    ).exec() as Promise<INotificationPreference>;
  }
}
