import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createPlanSchema,
  type CreatePlanFormData,
} from '../../validators/plan.validators';
import type { Plan } from '../../types/plan.types';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Select } from '@/shared/components/ui/Select';

interface PlanFormProps {
  plan?: Plan | null;
  onSubmit: (data: CreatePlanFormData) => void;
  isLoading?: boolean;
  onCancel: () => void;
}

const billingCycleOptions = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export function PlanForm({ plan, onSubmit, isLoading, onCancel }: PlanFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreatePlanFormData>({
    resolver: zodResolver(createPlanSchema),
    defaultValues: plan
      ? {
          name: plan.name,
          slug: plan.slug,
          description: plan.description,
          projectsLimit: plan.projectsLimit,
          usersLimit: plan.usersLimit,
          price: plan.price,
          billingCycle: plan.billingCycle,
          features: plan.features.join(', '),
          isActive: plan.isActive,
          isDefault: plan.isDefault,
          sortOrder: plan.sortOrder,
        }
      : {
          billingCycle: 'monthly',
          projectsLimit: 3,
          usersLimit: 5,
          price: 0,
          isActive: true,
          isDefault: false,
          sortOrder: 0,
        },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Plan Name"
          {...register('name')}
          placeholder="e.g., Pro"
          error={errors.name?.message}
          required
        />
        <div>
          <Input
            label="Slug"
            {...register('slug')}
            placeholder="e.g., pro"
            error={errors.slug?.message}
            required
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Lowercase, used in URLs
          </p>
        </div>
      </div>

      {/* Description - using textarea styled to match glass theme */}
      <div className="w-full">
        <label className="mb-2 block text-sm font-medium text-foreground/90">
          Description
        </label>
        <textarea
          {...register('description')}
          placeholder="Brief description of the plan"
          rows={2}
          className="relative flex w-full rounded-xl px-4 py-2.5 text-sm bg-background/50 dark:bg-background/30 backdrop-blur-sm border border-border/50 transition-all duration-200 placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label="Price"
          {...register('price')}
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          error={errors.price?.message}
          required
        />

        <Select
          label="Billing Cycle"
          {...register('billingCycle')}
          options={billingCycleOptions}
          error={errors.billingCycle?.message}
          required
        />

        <Input
          label="Sort Order"
          {...register('sortOrder')}
          type="number"
          min="0"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Input
            label="Projects Limit"
            {...register('projectsLimit')}
            type="number"
            min="-1"
            error={errors.projectsLimit?.message}
            required
          />
          <p className="mt-1 text-xs text-muted-foreground">-1 for unlimited</p>
        </div>

        <div>
          <Input
            label="Users Limit"
            {...register('usersLimit')}
            type="number"
            min="-1"
            error={errors.usersLimit?.message}
            required
          />
          <p className="mt-1 text-xs text-muted-foreground">-1 for unlimited</p>
        </div>
      </div>

      <div>
        <Input
          label="Features"
          {...register('features')}
          placeholder="api_access, webhooks, advanced_reports"
          helperText="Comma-separated feature keys"
        />
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <input
                type="checkbox"
                checked={field.value}
                onChange={field.onChange}
                className="h-4 w-4 rounded border-border/50 bg-background/50 text-primary accent-primary"
              />
            )}
          />
          <span className="text-sm text-foreground">Active</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <Controller
            name="isDefault"
            control={control}
            render={({ field }) => (
              <input
                type="checkbox"
                checked={field.value}
                onChange={field.onChange}
                className="h-4 w-4 rounded border-border/50 bg-background/50 text-primary accent-primary"
              />
            )}
          />
          <span className="text-sm text-foreground">Default Plan</span>
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {plan ? 'Update Plan' : 'Create Plan'}
        </Button>
      </div>
    </form>
  );
}
