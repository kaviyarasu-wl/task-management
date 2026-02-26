import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { settingsSchema, type SettingsFormData } from '../validators/settings.validators';
import { cn } from '@/shared/lib/utils';

interface SettingsFormProps {
  defaultValues: {
    maxUsers: number;
    maxProjects: number;
  };
  onSubmit: (data: SettingsFormData) => void;
  isLoading?: boolean;
}

export function SettingsForm({ defaultValues, onSubmit, isLoading }: SettingsFormProps) {
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const handleFormSubmit = (data: SettingsFormData) => {
    onSubmit(data);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {showSuccess && (
        <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-800">
          <Check className="h-4 w-4" />
          Settings updated successfully
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="maxUsers" className="block text-sm font-medium">
            Maximum Users
          </label>
          <input
            {...register('maxUsers', { valueAsNumber: true })}
            type="number"
            id="maxUsers"
            min={1}
            max={10000}
            className={cn(
              'mt-1 block w-full rounded-md border border-border bg-background px-3 py-2',
              'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
              errors.maxUsers && 'border-destructive'
            )}
          />
          {errors.maxUsers && (
            <p className="mt-1 text-sm text-destructive">{errors.maxUsers.message}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            The maximum number of users allowed in this organization
          </p>
        </div>

        <div>
          <label htmlFor="maxProjects" className="block text-sm font-medium">
            Maximum Projects
          </label>
          <input
            {...register('maxProjects', { valueAsNumber: true })}
            type="number"
            id="maxProjects"
            min={1}
            max={10000}
            className={cn(
              'mt-1 block w-full rounded-md border border-border bg-background px-3 py-2',
              'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
              errors.maxProjects && 'border-destructive'
            )}
          />
          {errors.maxProjects && (
            <p className="mt-1 text-sm text-destructive">{errors.maxProjects.message}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            The maximum number of projects allowed in this organization
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isLoading || !isDirty}
          className={cn(
            'flex items-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground',
            'hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </button>
        {isDirty && (
          <button
            type="button"
            onClick={() => reset(defaultValues)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Reset
          </button>
        )}
      </div>
    </form>
  );
}
