import { forwardRef, type InputHTMLAttributes, useId, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/shared/lib/utils';
import { slideUpVariants } from '@/shared/lib/motion';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { className, label, error, helperText, id: providedId, onFocus, onBlur, ...props },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId ?? generatedId;
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;
    const hasError = Boolean(error);
    const [isFocused, setIsFocused] = useState(false);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="mb-2 block text-sm font-medium text-foreground/90"
          >
            {label}
            {props.required && (
              <span className="ml-1 text-destructive">*</span>
            )}
          </label>
        )}
        <div className="relative">
          {/* Glow effect on focus */}
          <motion.div
            className={cn(
              'absolute -inset-px rounded-xl pointer-events-none',
              hasError ? 'bg-destructive/30' : 'bg-primary/30'
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: isFocused ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            style={{ filter: 'blur(8px)' }}
            aria-hidden="true"
          />

          <input
            ref={ref}
            id={id}
            className={cn(
              'relative flex h-11 w-full rounded-xl px-4 py-2.5 text-sm',
              // Glass styling
              'bg-background/50 dark:bg-background/30',
              'backdrop-blur-sm',
              'border transition-all duration-200',
              'placeholder:text-muted-foreground/60',
              'focus:outline-none',
              'disabled:cursor-not-allowed disabled:opacity-50',
              hasError
                ? 'border-destructive/50 focus:border-destructive'
                : 'border-border/50 focus:border-primary/50',
              className
            )}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? errorId : helperText ? helperId : undefined
            }
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
            {...props}
          />
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              key="error"
              id={errorId}
              className="mt-2 text-sm text-destructive"
              role="alert"
              variants={slideUpVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {error}
            </motion.p>
          )}
          {helperText && !error && (
            <motion.p
              key="helper"
              id={helperId}
              className="mt-2 text-sm text-muted-foreground/70"
              variants={slideUpVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {helperText}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
export type { InputProps };
