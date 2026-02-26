import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import type { Task } from '@/shared/types/entities.types';
import type { Status } from '@/features/statuses/types/status.types';
import { StatusIconComponent } from '@/features/statuses';
import { TaskCard } from './TaskCard';
import { cn } from '@/shared/lib/utils';

interface BoardColumnProps {
  status: Status;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: (statusId: string) => void;
  isDropDisabled?: boolean;
}

export function BoardColumn({
  status,
  tasks,
  onTaskClick,
  onAddTask,
  isDropDisabled = false,
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status._id,
    disabled: isDropDisabled,
  });

  return (
    <div
      className={cn(
        'flex h-full w-72 flex-shrink-0 flex-col rounded-lg bg-muted/50',
        isOver && !isDropDisabled && 'ring-2 ring-primary/50',
        isDropDisabled && isOver && 'ring-2 ring-destructive/50'
      )}
    >
      {/* Header with dynamic color */}
      <div
        className="flex items-center justify-between p-3 border-b-2"
        style={{ borderColor: status.color }}
      >
        <div className="flex items-center gap-2">
          <StatusIconComponent
            icon={status.icon}
            color={status.color}
            className="h-4 w-4"
          />
          <h3 className="font-medium text-foreground">{status.name}</h3>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(status._id)}
          className="rounded-md p-1 hover:bg-muted"
          title="Add task"
        >
          <Plus className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Tasks */}
      <div ref={setNodeRef} className="flex-1 overflow-y-auto p-2 pt-0">
        <SortableContext
          items={tasks.map((t) => t._id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2 pt-2">
            {tasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onClick={() => onTaskClick(task)}
              />
            ))}
          </div>
        </SortableContext>

        {tasks.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
}
