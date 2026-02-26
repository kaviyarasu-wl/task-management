import type { TenantPlan } from '@/shared/types/api.types';
import { cn } from '@/shared/lib/utils';

const PLAN_CONFIG: Record<TenantPlan, { label: string; className: string }> = {
  free: { label: 'Free', className: 'bg-gray-100 text-gray-800' },
  pro: { label: 'Pro', className: 'bg-blue-100 text-blue-800' },
  enterprise: { label: 'Enterprise', className: 'bg-purple-100 text-purple-800' },
};

interface PlanBadgeProps {
  plan: TenantPlan;
  className?: string;
}

export function PlanBadge({ plan, className }: PlanBadgeProps) {
  const config = PLAN_CONFIG[plan];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
