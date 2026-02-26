import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import type { Task } from '@/shared/types/entities.types';
import type { TaskStatus } from '@/shared/types/api.types';
import { TaskCard } from './TaskCard';
import { cn } from '@/shared/lib/utils';

interface BoardColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
}

export function BoardColumn({
  id,
  title,
  tasks,
  onTaskClick,
  onAddTask,
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      className={cn(
        'flex h-full w-72 flex-shrink-0 flex-col rounded-lg bg-muted/50',
        isOver && 'ring-2 ring-primary/50'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-foreground">{title}</h3>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(id)}
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
          <div className="space-y-2">
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
