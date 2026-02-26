import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { createStatusSchema, type CreateStatusFormData } from '../validators/status.validators';
import type { Status, StatusCategory } from '../types/status.types';
import { ColorPicker } from './ColorPicker';
import { IconPicker } from './IconPicker';

interface StatusFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateStatusFormData) => void;
  status?: Status; // If provided, editing mode
  isLoading?: boolean;
}

const CATEGORY_OPTIONS: { value: StatusCategory; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'closed', label: 'Closed' },
];

export function StatusFormModal({
  isOpen,
  onClose,
  onSubmit,
  status,
  isLoading = false,
}: StatusFormModalProps) {
  const isEditing = !!status;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateStatusFormData>({
    resolver: zodResolver(createStatusSchema),
    defaultValues: {
      name: '',
      color: '#3b82f6',
      icon: 'circle',
      category: 'open',
    },
  });

  // Reset form when modal opens/closes or status changes
  useEffect(() => {
    if (isOpen) {
      if (status) {
        reset({
          name: status.name,
          color: status.color,
          icon: status.icon,
          category: status.category,
        });
      } else {
        reset({
          name: '',
          color: '#3b82f6',
          icon: 'circle',
          category: 'open',
        });
      }
    }
  }, [isOpen, status, reset]);

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

  const color = watch('color');
  const icon = watch('icon');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {isEditing ? 'Edit Status' : 'Create Status'}
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-foreground">
              Name *
            </label>
            <input
              id="name"
              {...register('name')}
              className={cn(
                'w-full rounded-md border border-border bg-background px-3 py-2 text-sm',
                'focus:outline-none focus:ring-2 focus:ring-primary/50',
                errors.name && 'border-destructive'
              )}
              placeholder="e.g., In Review"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="mb-1 block text-sm font-medium text-foreground">
              Category *
            </label>
            <select
              id="category"
              {...register('category')}
              className={cn(
                'w-full rounded-md border border-border bg-background px-3 py-2 text-sm',
                'focus:outline-none focus:ring-2 focus:ring-primary/50'
              )}
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Color */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Color</label>
            <ColorPicker
              value={color}
              onChange={(c) => setValue('color', c)}
            />
          </div>

          {/* Icon */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Icon</label>
            <IconPicker
              value={icon}
              onChange={(i) => setValue('icon', i)}
              color={color}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
