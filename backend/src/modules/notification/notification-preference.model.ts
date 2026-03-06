import { Schema, model, Types } from 'mongoose';
import { applyBaseSchema, BaseDocument } from '@infrastructure/database/mongodb/baseModel';

export interface INotificationPreference extends BaseDocument {
  userId: Types.ObjectId;
  channels: {
    inApp: boolean;
    email: boolean;
  };
  events: {
    taskAssigned: boolean;
    taskCompleted: boolean;
    commentMention: boolean;
    userInvited: boolean;
    projectUpdated: boolean;
    taskDueSoon: boolean;
  };
}

export const DEFAULT_CHANNELS = { inApp: true, email: true };
export const DEFAULT_EVENTS = {
  taskAssigned: true,
  taskCompleted: true,
  commentMention: true,
  userInvited: true,
  projectUpdated: false,
  taskDueSoon: true,
};

const preferenceSchema = new Schema<INotificationPreference>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  channels: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
  },
  events: {
    taskAssigned: { type: Boolean, default: true },
    taskCompleted: { type: Boolean, default: true },
    commentMention: { type: Boolean, default: true },
    userInvited: { type: Boolean, default: true },
    projectUpdated: { type: Boolean, default: false },
    taskDueSoon: { type: Boolean, default: true },
  },
});

applyBaseSchema(preferenceSchema);

// One preference doc per user per tenant
preferenceSchema.index({ tenantId: 1, userId: 1 }, { unique: true });

export const NotificationPreference = model<INotificationPreference>(
  'NotificationPreference',
  preferenceSchema
);
