import {
  CheckSquare,
  UserPlus,
  MessageSquare,
  Clock,
  AlertTriangle,
  UserMinus,
  Users,
  FolderKanban,
} from 'lucide-react';
import { cn, formatRelativeTime } from '@/shared/lib/utils';
import type { Notification, NotificationType } from '../types/notification.types';

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onClick: (notification: Notification) => void;
}

function getNotificationIcon(type: NotificationType) {
  const iconMap: Record<NotificationType, { icon: typeof CheckSquare; color: string }> = {
    task_assigned: { icon: UserPlus, color: 'text-blue-500' },
    task_completed: { icon: CheckSquare, color: 'text-green-500' },
    task_due_soon: { icon: Clock, color: 'text-amber-500' },
    task_overdue: { icon: AlertTriangle, color: 'text-destructive' },
    comment_mention: { icon: MessageSquare, color: 'text-purple-500' },
    comment_reply: { icon: MessageSquare, color: 'text-blue-500' },
    project_invite: { icon: FolderKanban, color: 'text-primary' },
    member_joined: { icon: Users, color: 'text-green-500' },
    member_removed: { icon: UserMinus, color: 'text-destructive' },
  };

  return iconMap[type] || { icon: CheckSquare, color: 'text-muted-foreground' };
}

export function NotificationItem({
  notification,
  onMarkRead,
  onClick,
}: NotificationItemProps) {
  const { icon: Icon, color } = getNotificationIcon(notification.type);

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkRead(notification._id);
    }
    onClick(notification);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors',
        notification.isRead
          ? 'hover:bg-muted/30'
          : 'bg-primary/5 hover:bg-primary/10'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          notification.isRead ? 'bg-muted/50' : 'bg-primary/10'
        )}
      >
        <Icon className={cn('h-4 w-4', color)} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-sm',
            notification.isRead
              ? 'text-foreground/70'
              : 'font-medium text-foreground'
          )}
        >
          {notification.title}
        </p>
        {notification.message && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {notification.message}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>

      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
      )}
    </button>
  );
}
