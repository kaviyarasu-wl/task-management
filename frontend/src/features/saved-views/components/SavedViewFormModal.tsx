import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useCreateSavedView, useUpdateSavedView } from '../hooks/useSavedViews';
import type { SavedView, SavedViewFilters } from '../types/savedView.types';

const savedViewSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be under 50 characters'),
  isShared: z.boolean(),
});

type SavedViewFormData = z.infer<typeof savedViewSchema>;

interface SavedViewFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: SavedViewFilters;
  editingView?: SavedView | null;
}

const FILTER_LABELS: Record<string, string> = {
  projectId: 'Project',
  statusId: 'Status',
  priority: 'Priority',
  assigneeId: 'Assignee',
};

export function SavedViewFormModal({
  isOpen,
  onClose,
  filters,
  editingView,
}: SavedViewFormModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const createMutation = useCreateSavedView();
  const updateMutation = useUpdateSavedView();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SavedViewFormData>({
    resolver: zodResolver(savedViewSchema),
    defaultValues: {
      name: '',
      isShared: false,
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        name: editingView?.name ?? '',
        isShared: editingView?.isShared ?? false,
      });
    }
  }, [isOpen, editingView, reset]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [isOpen]);

  const onSubmit = (data: SavedViewFormData) => {
    if (editingView) {
      updateMutation.mutate(
        { viewId: editingView._id, data: { ...data, filters } },
        { onSuccess: () => onClose() }
      );
    } else {
      createMutation.mutate(
        { ...data, filters },
        { onSuccess: () => onClose() }
      );
    }
  };

  const filterEntries = Object.entries(filters).filter(
    (entry): entry is [string, string] => Boolean(entry[1])
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="saved-view-title"
        tabIndex={-1}
        className="relative z-10 w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded p-1 hover:bg-muted"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        <h2 id="saved-view-title" className="text-lg font-semibold text-foreground">
          {editingView ? 'Edit View' : 'Save Current View'}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="view-name" className="mb-1 block text-sm font-medium text-foreground">
              View Name <span className="text-destructive">*</span>
            </label>
            <input
              id="view-name"
              type="text"
              placeholder="e.g. My High Priority Tasks"
              {...register('name')}
              className={cn(
                'w-full rounded-md border border-border bg-background px-3 py-2 text-sm',
                'focus:outline-none focus:ring-2 focus:ring-primary/50',
                errors.name && 'border-destructive'
              )}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Filters Preview */}
          {filterEntries.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Active Filters</p>
              <div className="flex flex-wrap gap-1.5">
                {filterEntries.map(([key, value]) => (
                  <span
                    key={key}
                    className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                  >
                    {FILTER_LABELS[key] ?? key}: {value}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Shared Toggle */}
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              {...register('isShared')}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/50"
            />
            <div>
              <p className="text-sm font-medium text-foreground">Share with team</p>
              <p className="text-xs text-muted-foreground">
                All team members will see this view
              </p>
            </div>
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={cn(
                'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium',
                'bg-primary text-primary-foreground hover:bg-primary/90',
                'disabled:opacity-50'
              )}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingView ? 'Update' : 'Save View'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
