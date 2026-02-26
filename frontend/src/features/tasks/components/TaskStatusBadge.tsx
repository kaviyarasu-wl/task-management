import { cn } from '@/shared/lib/utils';
import type { Status } from '@/features/statuses/types/status.types';
import { StatusIconComponent } from '@/features/statuses';

interface TaskStatusBadgeProps {
  status: Status;
  showIcon?: boolean;
}

export function TaskStatusBadge({ status, showIcon = false }: TaskStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium'
      )}
      style={{
        backgroundColor: `${status.color}20`,
        color: status.color,
      }}
    >
      {showIcon && (
        <StatusIconComponent
          icon={status.icon}
          color={status.color}
          className="h-3 w-3"
        />
      )}
      {status.name}
    </span>
  );
}

// Fallback for loading states
export function TaskStatusBadgeSkeleton() {
  return (
    <span className="inline-flex h-5 w-16 animate-pulse rounded-full bg-muted" />
  );
}
