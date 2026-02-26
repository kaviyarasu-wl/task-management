import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import type { Project } from '@/shared/types/entities.types';
import {
  createProjectSchema,
  type CreateProjectFormData,
} from '../validators/project.validators';
import { cn } from '@/shared/lib/utils';

const COLOR_OPTIONS = [
  '#3498db', '#2ecc71', '#e74c3c', '#9b59b6',
  '#f39c12', '#1abc9c', '#e67e22', '#34495e',
];

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProjectFormData) => void;
  project?: Project | null;
  isLoading?: boolean;
}

export function ProjectFormModal({
  isOpen,
  onClose,
  onSubmit,
  project,
  isLoading,
}: ProjectFormModalProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      description: '',
      color: COLOR_OPTIONS[0],
    },
  });

  const selectedColor = watch('color');

  useEffect(() => {
    if (project) {
      reset({
        name: project.name,
        description: project.description || '',
        color: project.color || COLOR_OPTIONS[0],
      });
    } else {
      reset({
        name: '',
        description: '',
        color: COLOR_OPTIONS[0],
      });
    }
  }, [project, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {project ? 'Edit Project' : 'Create Project'}
          </h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium">
              Name
            </label>
            <input
              {...register('name')}
              type="text"
              id="name"
              className={cn(
                'mt-1 block w-full rounded-md border border-border bg-background px-3 py-2',
                'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
                errors.name && 'border-destructive'
              )}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium">
              Description
            </label>
            <textarea
              {...register('description')}
              id="description"
              rows={3}
              className={cn(
                'mt-1 block w-full rounded-md border border-border bg-background px-3 py-2',
                'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
                errors.description && 'border-destructive'
              )}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Color</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue('color', color)}
                  className={cn(
                    'h-8 w-8 rounded-full border-2 transition-transform hover:scale-110',
                    selectedColor === color ? 'border-foreground' : 'border-transparent'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'flex items-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground',
                'hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {project ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
