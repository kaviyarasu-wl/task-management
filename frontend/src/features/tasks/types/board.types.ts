import type { Status } from '@/features/statuses/types/status.types';
import type { Task } from '@/shared/types/entities.types';

export interface BoardColumn {
  id: string; // Status ID
  status: Status;
  tasks: Task[];
}
