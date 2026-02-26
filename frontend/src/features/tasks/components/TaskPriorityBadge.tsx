import { cn } from '@/shared/lib/utils';
import type { TaskPriority } from '@/shared/types/api.types';

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
}

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; className: string }> = {
  low: {
    label: 'Low',
    className: 'bg-slate-100 text-slate-700',
  },
  medium: {
    label: 'Medium',
    className: 'bg-blue-100 text-blue-700',
  },
  high: {
    label: 'High',
    className: 'bg-orange-100 text-orange-700',
  },
  urgent: {
    label: 'Urgent',
    className: 'bg-red-100 text-red-700',
  },
};

export function TaskPriorityBadge({ priority }: TaskPriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];

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
