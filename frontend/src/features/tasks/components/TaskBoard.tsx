import { useState } from 'react';
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
import type { Task } from '@/shared/types/entities.types';
import type { TaskStatus } from '@/shared/types/api.types';
import { BoardColumn } from './BoardColumn';
import { TaskCard } from './TaskCard';
import { COLUMN_ORDER, COLUMN_TITLES } from '../types/board.types';

interface TaskBoardProps {
  tasks: Task[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onTaskClick: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
}

export function TaskBoard({
  tasks,
  onStatusChange,
  onTaskClick,
  onAddTask,
}: TaskBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group tasks by status
  const columns = COLUMN_ORDER.map((status) => ({
    id: status,
    title: COLUMN_TITLES[status],
    tasks: tasks.filter((task) => task.status === status),
  }));

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t._id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const task = tasks.find((t) => t._id === taskId);
    if (!task) return;

    // Determine new status
    let newStatus: TaskStatus | null = null;

    // Check if dropped on a column
    if (COLUMN_ORDER.includes(over.id as TaskStatus)) {
      newStatus = over.id as TaskStatus;
    } else {
      // Dropped on another task - find its column
      const targetTask = tasks.find((t) => t._id === over.id);
      if (targetTask) {
        newStatus = targetTask.status;
      }
    }

    if (newStatus && newStatus !== task.status) {
      onStatusChange(taskId, newStatus);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <BoardColumn
            key={column.id}
            id={column.id}
            title={column.title}
            tasks={column.tasks}
            onTaskClick={onTaskClick}
            onAddTask={onAddTask}
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
