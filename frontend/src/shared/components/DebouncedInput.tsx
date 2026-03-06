import { useState, useEffect, useCallback, type InputHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/utils';

interface DebouncedInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
}

export function DebouncedInput({
  value: externalValue,
  onChange,
  debounceMs = 300,
  className,
  ...props
}: DebouncedInputProps) {
  const [internalValue, setInternalValue] = useState(externalValue);

  useEffect(() => {
    setInternalValue(externalValue);
  }, [externalValue]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (internalValue !== externalValue) {
        onChange(internalValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [internalValue, debounceMs, onChange, externalValue]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalValue(e.target.value);
  }, []);

  return (
    <input
      value={internalValue}
      onChange={handleChange}
      className={cn(
        'w-full rounded-md border border-border bg-background px-3 py-2 text-sm',
        'focus:outline-none focus:ring-2 focus:ring-primary/50',
        className
      )}
      {...props}
    />
  );
}
