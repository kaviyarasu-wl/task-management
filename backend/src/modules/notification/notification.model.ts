import { Schema, model, Types } from 'mongoose';
import { applyBaseSchema, BaseDocument } from '@infrastructure/database/mongodb/baseModel';
import { NotificationType } from '../../types';

export type NotificationEntityType = 'task' | 'project' | 'comment' | 'invitation';

export interface INotification extends BaseDocument {
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  readAt: Date | null;
  data: Record<string, unknown>;
  entityType: NotificationEntityType;
  entityId: Types.ObjectId;
}

const notificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  title: { type: String, required: true, maxlength: 200 },
  message: { type: String, required: true, maxlength: 1000 },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date, default: null },
  data: { type: Schema.Types.Mixed, default: {} },
  entityType: {
    type: String,
    enum: ['task', 'project', 'comment', 'invitation'],
    required: true,
  },
  entityId: { type: Schema.Types.ObjectId, required: true },
});

applyBaseSchema(notificationSchema);

// User's notification feed — primary query
notificationSchema.index({ tenantId: 1, userId: 1, createdAt: -1 });
// Unread count — filtered subquery
notificationSchema.index({ tenantId: 1, userId: 1, isRead: 1 });

export const Notification = model<INotification>('Notification', notificationSchema);
