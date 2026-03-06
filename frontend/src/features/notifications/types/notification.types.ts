export type NotificationType =
  | 'task_assigned'
  | 'task_completed'
  | 'task_due_soon'
  | 'task_overdue'
  | 'comment_mention'
  | 'comment_reply'
  | 'project_invite'
  | 'member_joined'
  | 'member_removed';

export interface Notification {
  _id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  /** Entity reference for click-through navigation */
  entityType?: 'task' | 'project' | 'comment';
  entityId?: string;
  /** Additional metadata */
  metadata?: Record<string, string>;
  createdAt: string;
}

export type NotificationChannel = 'inApp' | 'email';

export type NotificationEventKey =
  | 'taskAssigned'
  | 'taskCompleted'
  | 'commentMention'
  | 'userInvited'
  | 'projectUpdated'
  | 'taskDueSoon';

export interface NotificationPreferences {
  channels: Record<NotificationChannel, boolean>;
  events: Record<NotificationEventKey, boolean>;
}

export type NotificationPreferencesUpdate = {
  channels?: Partial<Record<NotificationChannel, boolean>>;
  events?: Partial<Record<NotificationEventKey, boolean>>;
};
