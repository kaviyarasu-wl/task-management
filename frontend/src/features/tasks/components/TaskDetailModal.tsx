import { useEffect } from 'react';
import { X, Calendar, Tag, User, Edit } from 'lucide-react';
import type { Task } from '@/shared/types/entities.types';
import { TaskStatusBadge } from './TaskStatusBadge';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { formatDate } from '@/shared/lib/utils';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
}

export function TaskDetailModal({
  task,
  isOpen,
  onClose,
  onEdit,
}: TaskDetailModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !task) return null;

  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-lg border border-border bg-background p-6 shadow-lg">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-8">
            <h2 className="text-lg font-semibold text-foreground">{task.title}</h2>
            <div className="mt-2 flex items-center gap-2">
              <TaskStatusBadge status={task.status} />
              <TaskPriorityBadge priority={task.priority} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(task)}
              className="rounded p-1 hover:bg-muted"
              title="Edit task"
            >
              <Edit className="h-5 w-5 text-muted-foreground" />
            </button>
            <button
              onClick={onClose}
              className="rounded p-1 hover:bg-muted"
              aria-label="Close modal"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-foreground">Description</h3>
            <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
              {task.description}
            </p>
          </div>
        )}

        {/* Details */}
        <div className="mt-6 space-y-3">
          {/* Due Date */}
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Due Date:</span>
            {task.dueDate ? (
              <span
                className={`text-sm ${isOverdue ? 'text-destructive' : 'text-foreground'}`}
              >
                {formatDate(task.dueDate)}
                {isOverdue && ' (Overdue)'}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">Not set</span>
            )}
          </div>

          {/* Assignee */}
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Assignee:</span>
            {task.assigneeId ? (
              <span className="text-sm text-foreground">Assigned</span>
            ) : (
              <span className="text-sm text-muted-foreground">Unassigned</span>
            )}
          </div>

          {/* Tags */}
          {task.tags.length > 0 && (
            <div className="flex items-start gap-3">
              <Tag className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span className="text-sm text-muted-foreground">Tags:</span>
              <div className="flex flex-wrap gap-1">
                {task.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-between border-t border-border pt-4 text-xs text-muted-foreground">
          <span>Created: {formatDate(task.createdAt)}</span>
          <span>Updated: {formatDate(task.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}
