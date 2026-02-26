import { MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { Task } from '@/shared/types/entities.types';
import type { TaskStatus } from '@/shared/types/api.types';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { cn, formatDate } from '@/shared/lib/utils';

interface TaskRowProps {
  task: Task;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onView: (task: Task) => void;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function TaskRow({ task, onStatusChange, onEdit, onDelete, onView }: TaskRowProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <tr className="border-b border-border hover:bg-muted/50">
      {/* Title */}
      <td className="px-4 py-3">
        <button
          onClick={() => onView(task)}
          className="text-left font-medium text-foreground hover:text-primary"
        >
          {task.title}
        </button>
        {task.tags.length > 0 && (
          <div className="mt-1 flex gap-1">
            {task.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <select
          value={task.status}
          onChange={(e) => onStatusChange(task._id, e.target.value as TaskStatus)}
          className="rounded border-0 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </td>

      {/* Priority */}
      <td className="px-4 py-3">
        <TaskPriorityBadge priority={task.priority} />
      </td>

      {/* Due Date */}
      <td className="px-4 py-3">
        {task.dueDate ? (
          <span className={cn('text-sm', isOverdue && 'text-destructive')}>
            {formatDate(task.dueDate)}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </td>

      {/* Assignee */}
      <td className="px-4 py-3">
        {task.assigneeId ? (
          <span className="text-sm text-foreground">Assigned</span>
        ) : (
          <span className="text-sm text-muted-foreground">Unassigned</span>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="rounded p-1 hover:bg-muted"
          >
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full z-10 mt-1 w-32 rounded-md border border-border bg-background shadow-lg">
              <button
                onClick={() => {
                  onView(task);
                  setIsMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
              >
                <Eye className="h-4 w-4" />
                View
              </button>
              <button
                onClick={() => {
                  onEdit(task);
                  setIsMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={() => {
                  onDelete(task);
                  setIsMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
