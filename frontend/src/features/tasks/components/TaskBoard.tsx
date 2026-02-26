import { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import type { Task } from '@/shared/types/entities.types';
import { useStatuses, useStatusStore, useTransitionMatrixQuery } from '@/features/statuses';
import { BoardColumn } from './BoardColumn';
import { TaskCard } from './TaskCard';
import { toast } from '@/shared/stores/toastStore';

interface TaskBoardProps {
  tasks: Task[];
  onStatusChange: (taskId: string, statusId: string) => void;
  onTaskClick: (task: Task) => void;
  onAddTask: (statusId: string) => void;
}

export function TaskBoard({
  tasks,
  onStatusChange,
  onTaskClick,
  onAddTask,
}: TaskBoardProps) {
  const statuses = useStatuses();
  const { transitionMatrix } = useStatusStore();
  // Fetch transition matrix (syncs to store automatically)
  useTransitionMatrixQuery();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group tasks by status, maintaining status order
  const columns = useMemo(() => {
    return statuses.map((status) => ({
      id: status._id,
      status,
      tasks: tasks.filter((task) => {
        // Handle both populated and ID-only status
        const taskStatusId = typeof task.status === 'object' && task.status !== null
          ? task.status._id
          : task.statusId;
        return taskStatusId === status._id;
      }),
    }));
  }, [statuses, tasks]);

  // Get allowed drop targets for active task
  const allowedDropIds = useMemo(() => {
    if (!activeTask) return statuses.map((s) => s._id);

    const currentStatusId = typeof activeTask.status === 'object' && activeTask.status !== null
      ? activeTask.status._id
      : activeTask.statusId;

    // If no transition matrix available, allow all
    if (!transitionMatrix || !transitionMatrix[currentStatusId]) {
      return statuses.map((s) => s._id);
    }

    return transitionMatrix[currentStatusId];
  }, [activeTask, transitionMatrix, statuses]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t._id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const task = tasks.find((t) => t._id === taskId);
    if (!task) return;

    // Determine new status
    let newStatusId: string | null = null;

    // Check if dropped on a column (status)
    const droppedOnStatus = statuses.find((s) => s._id === over.id);
    if (droppedOnStatus) {
      newStatusId = droppedOnStatus._id;
    } else {
      // Dropped on another task - find its status
      const targetTask = tasks.find((t) => t._id === over.id);
      if (targetTask) {
        newStatusId = typeof targetTask.status === 'object' && targetTask.status !== null
          ? targetTask.status._id
          : targetTask.statusId;
      }
    }

    const currentStatusId = typeof task.status === 'object' && task.status !== null
      ? task.status._id
      : task.statusId;

    // Only trigger change if status actually changed and transition is allowed
    if (newStatusId && newStatusId !== currentStatusId) {
      if (allowedDropIds.includes(newStatusId)) {
        onStatusChange(taskId, newStatusId);
      } else {
        // Show feedback for invalid transition
        const fromStatus = statuses.find((s) => s._id === currentStatusId);
        const toStatus = statuses.find((s) => s._id === newStatusId);

        toast({
          type: 'error',
          title: 'Transition not allowed',
          message: `Cannot move from "${fromStatus?.name ?? 'Unknown'}" to "${toStatus?.name ?? 'Unknown'}". This transition is not allowed by workflow rules.`,
        });
      }
    }
  };

  if (statuses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <p className="mb-4 text-muted-foreground">
          No statuses configured. Create statuses in settings to use the board view.
        </p>
        <Link
          to="/settings/statuses"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Settings className="h-4 w-4" />
          Go to Settings
        </Link>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(({ id, status, tasks: columnTasks }) => (
          <BoardColumn
            key={id}
            status={status}
            tasks={columnTasks}
            onTaskClick={onTaskClick}
            onAddTask={onAddTask}
            isDropDisabled={activeTask !== null && !allowedDropIds.includes(id)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <TaskCard task={activeTask} onClick={() => {}} isDragging />
        )}
      </DragOverlay>
    </DndContext>
  );
}
