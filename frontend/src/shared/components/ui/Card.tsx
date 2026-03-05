import { forwardRef, type HTMLAttributes } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';
import { cardHoverEffect, springTransition } from '@/shared/lib/motion';

const cardVariants = cva('rounded-2xl transition-all duration-300', {
  variants: {
    variant: {
      default: [
        'bg-background/80 dark:bg-background/60',
        'border border-border/50',
        'shadow-sm',
      ].join(' '),
      glass: [
        'bg-[var(--glass-bg)]',
        'backdrop-blur-xl',
        'border border-[var(--glass-border)]',
        'shadow-glass',
      ].join(' '),
      'glass-subtle': [
        'bg-white/[0.08] dark:bg-white/[0.04]',
        'backdrop-blur-md',
        'border border-white/10 dark:border-white/5',
        'shadow-glass-sm',
      ].join(' '),
      dark: [
        'bg-slate-800/90',
        'border border-slate-700/50',
        'shadow-lg shadow-black/20',
      ].join(' '),
      elevated: [
        'bg-background',
        'border border-border/50',
        'shadow-lg shadow-black/5 dark:shadow-black/20',
      ].join(' '),
      outlined: [
        'bg-transparent',
        'border-2 border-border',
      ].join(' '),
      ghost: 'bg-transparent border-transparent',
    },
    padding: {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    },
    interactive: {
      true: 'cursor-pointer',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'glass',
    padding: 'md',
    interactive: false,
  },
});

type MotionDivProps = Omit<HTMLMotionProps<'div'>, 'children'>;

interface CardProps
  extends Omit<HTMLAttributes<HTMLDivElement>, keyof MotionDivProps>,
    MotionDivProps,
    VariantProps<typeof cardVariants> {
  children?: React.ReactNode;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, interactive, children, ...props }, ref) => {
    const isInteractive = interactive === true;

    return (
      <motion.div
        ref={ref}
        className={cn(
          cardVariants({ variant, padding, interactive }),
          // Add gradient overlay for glass variants
          (variant === 'glass' || variant === 'glass-subtle') && 'relative overflow-hidden',
          className
        )}
        whileHover={isInteractive ? cardHoverEffect : undefined}
        transition={springTransition}
        {...props}
      >
        {/* Subtle gradient overlay for glass effect */}
        {(variant === 'glass' || variant === 'glass-subtle') && (
          <div
            className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/[0.02] pointer-events-none rounded-2xl"
            aria-hidden="true"
          />
        )}
        <div className="relative">{children}</div>
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col space-y-1.5 pb-4', className)}
        {...props}
      />
    );
  }
);

CardHeader.displayName = 'CardHeader';

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn(
          'text-xl font-semibold leading-none tracking-tight text-foreground',
          className
        )}
        {...props}
      />
    );
  }
);

CardTitle.displayName = 'CardTitle';

interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn('text-sm text-muted-foreground/80', className)}
        {...props}
      />
    );
  }
);

CardDescription.displayName = 'CardDescription';

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn('', className)} {...props} />;
  }
);

CardContent.displayName = 'CardContent';

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center pt-4 border-t border-border/30',
          className
        )}
        {...props}
      />
    );
  }
);

CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  cardVariants,
};
export type { CardProps };
