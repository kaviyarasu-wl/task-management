import { cn } from '@/shared/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'glass' | 'text' | 'circular' | 'rectangular';
}

/**
 * Skeleton component with glassmorphism shimmer effect
 */
function Skeleton({ className, variant = 'glass' }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse',
        variant === 'glass' && [
          'bg-white/10 dark:bg-white/5',
          'backdrop-blur-sm',
          'rounded-xl',
          'shimmer',
        ],
        variant === 'default' && 'bg-muted rounded-lg',
        variant === 'text' && 'bg-muted/60 rounded h-4',
        variant === 'circular' && 'bg-muted rounded-full',
        variant === 'rectangular' && 'bg-muted rounded-lg',
        className
      )}
      aria-busy="true"
      aria-live="polite"
    />
  );
}

/**
 * Skeleton text line with variable width
 */
function SkeletonText({
  lines = 1,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={cn(
            'h-4',
            i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton card with glass effect
 */
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-2xl p-6',
        'bg-[var(--glass-bg)]',
        'backdrop-blur-xl',
        'border border-[var(--glass-border)]',
        'shadow-glass',
        className
      )}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton variant="circular" className="h-12 w-12" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="h-4 w-1/3" />
            <Skeleton variant="text" className="h-3 w-1/2" />
          </div>
        </div>
        <SkeletonText lines={3} />
      </div>
    </div>
  );
}

/**
 * Skeleton for list items
 */
function SkeletonList({
  items = 3,
  className,
}: {
  items?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'flex items-center gap-3 p-4 rounded-xl',
            'bg-white/5 dark:bg-white/[0.02]',
            'backdrop-blur-sm',
            'border border-white/10'
          )}
        >
          <Skeleton variant="circular" className="h-10 w-10 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="h-4 w-1/3" />
            <Skeleton variant="text" className="h-3 w-2/3" />
          </div>
          <Skeleton variant="rectangular" className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for stats/metric cards
 */
function SkeletonStats({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-2xl p-6',
        'bg-[var(--glass-bg)]',
        'backdrop-blur-xl',
        'border border-[var(--glass-border)]',
        'shadow-glass',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton variant="text" className="h-4 w-20" />
          <Skeleton variant="default" className="h-8 w-24" />
        </div>
        <Skeleton variant="circular" className="h-10 w-10" />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Skeleton variant="default" className="h-4 w-12" />
        <Skeleton variant="text" className="h-3 w-16" />
      </div>
    </div>
  );
}

/**
 * Skeleton for table rows
 */
function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {/* Header */}
      <div className="flex gap-4 p-4 border-b border-border/30">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton
            key={i}
            variant="text"
            className={cn(
              'h-4',
              i === 0 ? 'w-1/4' : 'flex-1'
            )}
          />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex gap-4 p-4 border-b border-border/20"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              variant="text"
              className={cn(
                'h-4',
                colIndex === 0 ? 'w-1/4' : 'flex-1'
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonList,
  SkeletonStats,
  SkeletonTable,
};
export type { SkeletonProps };
