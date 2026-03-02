import { forwardRef, type SelectHTMLAttributes, useId, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { slideUpVariants } from '@/shared/lib/motion';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      options,
      placeholder,
      id: providedId,
      onFocus,
      onBlur,
      ...props
    },
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

          <select
            ref={ref}
            id={id}
            className={cn(
              'relative flex h-11 w-full appearance-none rounded-xl px-4 py-2.5 pr-10 text-sm',
              // Glass styling
              'bg-background/50 dark:bg-background/30',
              'backdrop-blur-sm',
              'border transition-all duration-200',
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
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
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

Select.displayName = 'Select';

export { Select };
export type { SelectProps, SelectOption };
