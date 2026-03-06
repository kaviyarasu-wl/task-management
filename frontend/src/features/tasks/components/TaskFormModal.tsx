import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { X, Loader2, RefreshCw } from 'lucide-react';
import type { Task } from '@/shared/types/entities.types';
import type { Project } from '@/shared/types/entities.types';
import type { TaskPriority } from '@/shared/types/api.types';
import { useStatuses, useDefaultStatus } from '@/features/statuses';
import { useMembers } from '@/features/users';
import { createTaskSchema, type CreateTaskFormData } from '../validators/task.validators';
import { cn } from '@/shared/lib/utils';
import { UserSelect } from '@/shared/components/UserSelect';
import { RecurrenceSelect } from './RecurrenceSelect';
import { RecurrencePreview } from './RecurrencePreview';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskFormData) => void;
  task: Task | null;
  projects: Project[];
  isLoading?: boolean;
  initialStatusId?: string; // For creating task in a specific column
}

const PRIORITY_VALUES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

export function TaskFormModal({
  isOpen,
  onClose,
  onSubmit,
  task,
  projects,
  isLoading = false,
  initialStatusId,
}: TaskFormModalProps) {
  const { t } = useTranslation('tasks');
  const statuses = useStatuses();
  const defaultStatus = useDefaultStatus();
  const { data: membersData } = useMembers();
  const members = membersData?.data ?? [];
  const [showRecurrence, setShowRecurrence] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskSchema),
  });

  // Reset form when modal opens/closes or task changes
  useEffect(() => {
    if (isOpen) {
      if (task) {
        const taskStatusId = typeof task.status === 'object' && task.status !== null
          ? task.status._id
          : task.statusId;

        const hasRecurrence = !!task.recurrence;
        setShowRecurrence(hasRecurrence);

        reset({
          title: task.title,
          description: task.description ?? '',
          projectId: task.projectId,
          statusId: taskStatusId,
          priority: task.priority,
          dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
          tags: task.tags.join(', '),
          assigneeId: task.assigneeId ?? null,
          recurrence: task.recurrence ?? null,
        });
      } else {
        setShowRecurrence(false);
        reset({
          title: '',
          description: '',
          projectId: projects[0]?._id ?? '',
          statusId: initialStatusId ?? defaultStatus?._id ?? '',
          priority: 'medium',
          dueDate: '',
          tags: '',
          assigneeId: null,
          recurrence: null,
        });
      }
    }
  }, [isOpen, task, projects, reset, initialStatusId, defaultStatus]);

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

  if (!isOpen) return null;

  return (
    <div className={cn(
      'fixed inset-0 z-50',
      'flex flex-col',
      'md:flex md:items-center md:justify-center md:p-4'
    )}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className={cn(
        'relative z-10 w-full bg-background shadow-lg',
        'h-full overflow-y-auto',
        'md:h-auto md:max-h-[90vh] md:max-w-lg md:rounded-lg md:border md:border-border'
      )}>
        {/* Header - sticky on mobile */}
        <div className={cn(
          'flex items-center justify-between',
          'sticky top-0 z-10 bg-background/95 backdrop-blur-sm',
          'border-b border-border p-4 md:relative md:border-b md:p-6'
        )}>
          <h2 className="text-lg font-semibold text-foreground">
            {task ? t('edit') : t('create')}
          </h2>
          <button
            onClick={onClose}
            className="rounded p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-muted"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 md:p-6 space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-foreground">
              {t('form.title')} *
            </label>
            <input
              id="title"
              type="text"
              {...register('title')}
              className={cn(
                'mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm',
                'focus:outline-none focus:ring-2 focus:ring-primary/50',
                errors.title && 'border-destructive'
              )}
              placeholder={t('form.titlePlaceholder')}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-foreground">
              {t('form.description')}
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={3}
              className={cn(
                'mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm',
                'focus:outline-none focus:ring-2 focus:ring-primary/50'
              )}
              placeholder={t('form.descriptionPlaceholder')}
            />
          </div>

          {/* Project & Status */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="projectId" className="block text-sm font-medium text-foreground">
                {t('form.project')} *
              </label>
              <select
                id="projectId"
                {...register('projectId')}
                className={cn(
                  'mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-primary/50',
                  errors.projectId && 'border-destructive'
                )}
              >
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
              {errors.projectId && (
                <p className="mt-1 text-sm text-destructive">{errors.projectId.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="statusId" className="block text-sm font-medium text-foreground">
                {t('form.status')}
              </label>
              <select
                id="statusId"
                {...register('statusId')}
                className={cn(
                  'mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-primary/50'
                )}
              >
                {statuses.map((status) => (
                  <option key={status._id} value={status._id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority & Due Date */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-foreground">
                {t('form.priority')}
              </label>
              <select
                id="priority"
                {...register('priority')}
                className={cn(
                  'mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-primary/50'
                )}
              >
                {PRIORITY_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {t(`priority.${value}`)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-foreground">
                {t('form.dueDate')}
              </label>
              <input
                id="dueDate"
                type="date"
                {...register('dueDate')}
                className={cn(
                  'mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-primary/50'
                )}
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-foreground">
              {t('form.tags')}
            </label>
            <input
              id="tags"
              type="text"
              {...register('tags')}
              className={cn(
                'mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm',
                'focus:outline-none focus:ring-2 focus:ring-primary/50'
              )}
              placeholder={t('form.tagsPlaceholder')}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t('form.tagsHint')}
            </p>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-sm font-medium text-foreground">{t('form.assignee')}</label>
            <Controller
              name="assigneeId"
              control={control}
              render={({ field }) => (
                <UserSelect
                  users={members}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('form.unassigned')}
                  allowClear
                  className="mt-1"
                />
              )}
            />
          </div>

          {/* Recurrence */}
          <div className="border-t border-border pt-4">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={showRecurrence}
                onChange={(e) => {
                  setShowRecurrence(e.target.checked);
                  if (!e.target.checked) {
                    // Clear recurrence when toggled off
                    const currentValues = control._formValues;
                    reset({ ...currentValues, recurrence: null });
                  }
                }}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary/50"
              />
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{t('form.recurrence')}</span>
            </label>

            {showRecurrence && (
              <div className="mt-3 space-y-3">
                <Controller
                  name="recurrence"
                  control={control}
                  render={({ field }) => (
                    <RecurrenceSelect
                      value={field.value ?? null}
                      onChange={(pattern) => field.onChange(pattern)}
                    />
                  )}
                />

                {/* Preview next occurrences */}
                <Controller
                  name="recurrence"
                  control={control}
                  render={({ field }) =>
                    field.value ? (
                      <RecurrencePreview
                        pattern={field.value}
                        count={3}
                        className="rounded-md border border-border bg-muted/30 p-3"
                      />
                    ) : null
                  }
                />
              </div>
            )}
          </div>

          {/* Actions - sticky on mobile */}
          <div className={cn(
            'flex justify-end gap-3 pt-4',
            'sticky bottom-0 bg-background/95 backdrop-blur-sm',
            'border-t border-border pb-4 -mx-4 px-4',
            'md:relative md:border-0 md:mx-0 md:px-0 md:pb-0'
          )}>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 min-h-[44px]"
            >
              {t('common:actions.cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 min-h-[44px]"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {task ? t('common:actions.update') : t('common:actions.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
