import { type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';

const badgeVariants = cva(
  [
    'inline-flex items-center rounded-full font-medium',
    'transition-all duration-200',
    'backdrop-blur-sm',
  ].join(' '),
  {
    variants: {
      variant: {
        default: [
          'bg-primary/15 text-primary',
          'border border-primary/20',
        ].join(' '),
        secondary: [
          'bg-secondary/80 text-secondary-foreground',
          'border border-border/30',
        ].join(' '),
        success: [
          'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
          'border border-emerald-500/20',
        ].join(' '),
        warning: [
          'bg-amber-500/15 text-amber-600 dark:text-amber-400',
          'border border-amber-500/20',
        ].join(' '),
        destructive: [
          'bg-destructive/15 text-destructive',
          'border border-destructive/20',
        ].join(' '),
        info: [
          'bg-blue-500/15 text-blue-600 dark:text-blue-400',
          'border border-blue-500/20',
        ].join(' '),
        outline: [
          'bg-transparent text-foreground',
          'border border-border',
        ].join(' '),
        glass: [
          'bg-white/10 dark:bg-white/5 text-foreground',
          'border border-white/20 dark:border-white/10',
        ].join(' '),
        'glass-primary': [
          'bg-primary/10 dark:bg-primary/5 text-primary',
          'border border-primary/20 dark:border-primary/10',
        ].join(' '),
      },
      size: {
        sm: 'px-2 py-0.5 text-[10px]',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
export type { BadgeProps };
