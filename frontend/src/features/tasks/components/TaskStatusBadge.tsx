import { cn } from '@/shared/lib/utils';
import type { TaskStatus } from '@/shared/types/api.types';

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; className: string }> = {
  todo: {
    label: 'To Do',
    className: 'bg-slate-100 text-slate-700',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-blue-100 text-blue-700',
  },
  review: {
    label: 'Review',
    className: 'bg-purple-100 text-purple-700',
  },
  done: {
    label: 'Done',
    className: 'bg-green-100 text-green-700',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-700',
  },
};

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
