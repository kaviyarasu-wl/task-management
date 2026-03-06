import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface LazyPageFallbackProps {
  className?: string;
}

export function LazyPageFallback({ className }: LazyPageFallbackProps) {
  return (
    <div
      className={cn(
        'flex h-full min-h-[400px] items-center justify-center',
        className
      )}
      role="status"
      aria-label="Loading page"
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
