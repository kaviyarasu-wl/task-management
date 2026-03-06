import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

interface ResponsiveTableProps {
  children: ReactNode;
  className?: string;
}

export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  return (
    <div
      className={cn(
        'w-full overflow-x-auto',
        '-mx-4 px-4 md:mx-0 md:px-0',
        'scroll-smooth',
        '[&::-webkit-scrollbar]:h-1.5',
        '[&::-webkit-scrollbar-thumb]:rounded-full',
        '[&::-webkit-scrollbar-thumb]:bg-border/50',
        className
      )}
      role="region"
      aria-label="Scrollable table"
      tabIndex={0}
    >
      {children}
    </div>
  );
}
