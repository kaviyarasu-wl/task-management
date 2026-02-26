import type { TaskStatus } from '@/shared/types/api.types';
import type { Task } from '@/shared/types/entities.types';

export interface BoardColumn {
  id: TaskStatus;
  title: string;
  tasks: Task[];
}

export const COLUMN_ORDER: TaskStatus[] = [
  'todo',
  'in_progress',
  'review',
  'done',
];

export const COLUMN_TITLES: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
  cancelled: 'Cancelled',
};
