import { X } from 'lucide-react';
import type { TaskStatus, TaskPriority } from '@/shared/types/api.types';
import type { Project } from '@/shared/types/entities.types';
import { cn } from '@/shared/lib/utils';

interface TaskFiltersProps {
  projects: Project[];
  selectedProjectId?: string;
  selectedStatus?: TaskStatus;
  selectedPriority?: TaskPriority;
  onProjectChange: (projectId?: string) => void;
  onStatusChange: (status?: TaskStatus) => void;
  onPriorityChange: (priority?: TaskPriority) => void;
  onClearAll: () => void;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export function TaskFilters({
  projects,
  selectedProjectId,
  selectedStatus,
  selectedPriority,
  onProjectChange,
  onStatusChange,
  onPriorityChange,
  onClearAll,
}: TaskFiltersProps) {
  const hasFilters = selectedProjectId || selectedStatus || selectedPriority;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Project Filter */}
      <select
        value={selectedProjectId ?? ''}
        onChange={(e) => onProjectChange(e.target.value || undefined)}
        className={cn(
          'rounded-md border border-border bg-background px-3 py-2 text-sm',
          'focus:outline-none focus:ring-2 focus:ring-primary/50'
        )}
      >
        <option value="">All Projects</option>
        {projects.map((project) => (
          <option key={project._id} value={project._id}>
            {project.name}
          </option>
        ))}
      </select>

      {/* Status Filter */}
      <select
        value={selectedStatus ?? ''}
        onChange={(e) => onStatusChange((e.target.value as TaskStatus) || undefined)}
        className={cn(
          'rounded-md border border-border bg-background px-3 py-2 text-sm',
          'focus:outline-none focus:ring-2 focus:ring-primary/50'
        )}
      >
        <option value="">All Statuses</option>
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Priority Filter */}
      <select
        value={selectedPriority ?? ''}
        onChange={(e) => onPriorityChange((e.target.value as TaskPriority) || undefined)}
        className={cn(
          'rounded-md border border-border bg-background px-3 py-2 text-sm',
          'focus:outline-none focus:ring-2 focus:ring-primary/50'
        )}
      >
        <option value="">All Priorities</option>
        {PRIORITY_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Clear Filters */}
      {hasFilters && (
        <button
          onClick={onClearAll}
          className="flex items-center gap-1 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
          Clear
        </button>
      )}
    </div>
  );
}
