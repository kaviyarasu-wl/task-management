import { useEffect, useRef } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import type { Status } from '../types/status.types';

interface DeleteStatusDialogProps {
  isOpen: boolean;
  status: Status | null;
  taskCount?: number;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteStatusDialog({
  isOpen,
  status,
  taskCount = 0,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteStatusDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  const hasTasksUsingStatus = taskCount > 0;
  const isDeleteDisabled = isDeleting || hasTasksUsingStatus;

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isDeleting, onCancel]);

  // Focus trap
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen || !status) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={isDeleting ? undefined : onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-status-title"
        aria-describedby="delete-status-description"
        tabIndex={-1}
        className="relative z-10 w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-xl"
      >
        {/* Header */}
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1">
            <h2
              id="delete-status-title"
              className="text-lg font-semibold text-foreground"
            >
              Delete Status
            </h2>
            <p
              id="delete-status-description"
              className="text-sm text-muted-foreground"
            >
              Are you sure you want to delete "{status.name}"?
            </p>
          </div>
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Warning: Tasks using this status */}
        {hasTasksUsingStatus && (
          <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/5 p-3">
            <p className="text-sm text-destructive">
              <strong>
                {taskCount} task{taskCount === 1 ? '' : 's'}
              </strong>{' '}
              currently use{taskCount === 1 ? 's' : ''} this status. You must
              reassign them before deleting.
            </p>
          </div>
        )}

        {/* Warning: Default status */}
        {status.isDefault && !hasTasksUsingStatus && (
          <div className="mb-4 rounded-lg border border-yellow-500/50 bg-yellow-500/5 p-3">
            <p className="text-sm text-yellow-700 dark:text-yellow-500">
              This is the default status. A new default will be assigned
              automatically.
            </p>
          </div>
        )}

        {/* Info text */}
        {!hasTasksUsingStatus && (
          <p className="mb-4 text-sm text-muted-foreground">
            This action cannot be undone. Tasks will no longer be able to use
            this status.
          </p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleteDisabled}
            className="flex items-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
          >
            {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isDeleting ? 'Deleting...' : 'Delete Status'}
          </button>
        </div>
      </div>
    </div>
  );
}
