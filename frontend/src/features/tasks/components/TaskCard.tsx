import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Calendar, MessageSquare, RefreshCw } from 'lucide-react';
import type { Task } from '@/shared/types/entities.types';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { TaskCheckbox } from './TaskCheckbox';
import { useIsSelected, useSelectionStore } from '../stores/selectionStore';
import { cn, formatDate } from '@/shared/lib/utils';
import { UserAvatar } from '@/shared/components/UserAvatar';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  isDragging?: boolean;
}

export const TaskCard = memo(function TaskCard({ task, onClick, isDragging }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isSelected = useIsSelected(task._id);
  const isSelecting = useSelectionStore((state) => state.isSelecting);

  // Check if task status is in the "closed" category (e.g., done, cancelled)
  const isClosedStatus = typeof task.status === 'object' && task.status !== null
    ? task.status.category === 'closed'
    : false;

  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && !isClosedStatus;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative rounded-lg border border-border bg-background p-3 shadow-sm',
        'cursor-pointer hover:border-primary/50 hover:shadow-md',
        isDragging && 'opacity-50 shadow-lg',
        isSelected && 'ring-2 ring-primary'
      )}
    >
      {/* Selection checkbox */}
      {isSelecting && (
        <TaskCheckbox taskId={task._id} className="absolute right-2 top-2" />
      )}

      {/* Drag Handle & Priority */}
      <div className="flex items-center justify-between">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab rounded p-1 opacity-0 hover:bg-muted group-hover:opacity-100 active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <TaskPriorityBadge priority={task.priority} />
      </div>

      {/* Title */}
      <button
        onClick={onClick}
        className="mt-2 block w-full text-left text-sm font-medium text-foreground hover:text-primary"
      >
        {task.title}
      </button>

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
            >
              {tag}
            </span>
          ))}
          {task.tags.length > 2 && (
            <span className="text-xs text-muted-foreground">+{task.tags.length - 2}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        {task.dueDate ? (
          <span className={cn('flex items-center gap-1', isOverdue && 'text-destructive')}>
            <Calendar className="h-3 w-3" />
            {formatDate(task.dueDate)}
          </span>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-2">
          {(task.recurrence || task.recurrenceId) && (
            <span title="Recurring task">
              <RefreshCw className="h-3 w-3" />
            </span>
          )}
          {task.description && (
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
            </span>
          )}
          {task.assignee && (
            <UserAvatar
              firstName={task.assignee.firstName}
              lastName={task.assignee.lastName}
              size="sm"
            />
          )}
        </div>
      </div>
    </div>
  );
});
TaskCard.displayName = 'TaskCard';
