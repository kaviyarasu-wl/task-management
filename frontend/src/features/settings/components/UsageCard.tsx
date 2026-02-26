import { cn } from '@/shared/lib/utils';

interface UsageCardProps {
  title: string;
  current: number;
  max: number;
  icon: React.ReactNode;
}

export function UsageCard({ title, current, max, icon }: UsageCardProps) {
  const percentage = Math.min((current / max) * 100, 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-muted p-2">{icon}</div>
          <div>
            <p className="text-sm font-medium text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">
              {current} of {max} used
            </p>
          </div>
        </div>
        <span
          className={cn(
            'text-sm font-medium',
            isAtLimit
              ? 'text-destructive'
              : isNearLimit
              ? 'text-yellow-600'
              : 'text-muted-foreground'
          )}
        >
          {percentage.toFixed(0)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            isAtLimit
              ? 'bg-destructive'
              : isNearLimit
              ? 'bg-yellow-500'
              : 'bg-primary'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
