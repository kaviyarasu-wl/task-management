import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { springTransition } from '@/shared/lib/motion';

const buttonVariants = cva(
  [
    'relative inline-flex items-center justify-center gap-2',
    'rounded-xl text-sm font-medium',
    'transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: [
          'bg-primary text-primary-foreground',
          'hover:bg-primary/90 hover:shadow-glow-primary',
        ].join(' '),
        secondary: [
          'bg-secondary text-secondary-foreground',
          'border border-border/50',
          'hover:bg-secondary/80',
        ].join(' '),
        destructive: [
          'bg-destructive text-destructive-foreground',
          'hover:bg-destructive/90 hover:shadow-glow-destructive',
        ].join(' '),
        ghost: [
          'bg-transparent',
          'hover:bg-muted/50',
        ].join(' '),
        glass: [
          'bg-white/10 dark:bg-white/5',
          'backdrop-blur-lg',
          'border border-white/20 dark:border-white/10',
          'text-foreground',
          'shadow-glass',
          'hover:bg-white/20 dark:hover:bg-white/10',
          'hover:shadow-glass-lg hover:border-white/30',
        ].join(' '),
        'glass-primary': [
          'bg-primary/20 dark:bg-primary/10',
          'backdrop-blur-lg',
          'border border-primary/30 dark:border-primary/20',
          'text-primary dark:text-primary-foreground',
          'shadow-glass',
          'hover:bg-primary/30 dark:hover:bg-primary/20',
          'hover:shadow-glow-primary',
        ].join(' '),
        outline: [
          'border border-border bg-transparent',
          'hover:bg-muted/50',
        ].join(' '),
        link: 'text-primary underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10 p-0',
        'icon-sm': 'h-8 w-8 p-0',
        'icon-lg': 'h-12 w-12 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

type MotionButtonProps = Omit<HTMLMotionProps<'button'>, 'children'>;

interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof MotionButtonProps>,
    MotionButtonProps,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  children?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading,
      children,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = isLoading || disabled;

    return (
      <motion.button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={isDisabled}
        aria-busy={isLoading}
        whileHover={isDisabled ? undefined : { scale: 1.02 }}
        whileTap={isDisabled ? undefined : { scale: 0.98 }}
        transition={springTransition}
        {...props}
      >
        {/* Shimmer effect for glass variants */}
        {(variant === 'glass' || variant === 'glass-primary') && (
          <span
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:animate-shimmer group-hover:opacity-100"
            aria-hidden="true"
          />
        )}

        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        )}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
export type { ButtonProps };
