import { useRef, useCallback, type KeyboardEvent, type ClipboardEvent } from 'react';
import { cn } from '@/shared/lib/utils';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
}

export function OTPInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  error = false,
  autoFocus = true,
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const focusInput = useCallback(
    (index: number) => {
      const clampedIndex = Math.max(0, Math.min(index, length - 1));
      inputRefs.current[clampedIndex]?.focus();
    },
    [length]
  );

  const handleChange = useCallback(
    (index: number, digit: string) => {
      if (!/^\d?$/.test(digit)) return;

      const digits = value.split('');
      // Pad array to match length
      while (digits.length < length) digits.push('');
      digits[index] = digit;
      const newValue = digits.join('').slice(0, length);
      onChange(newValue);

      if (digit && index < length - 1) {
        focusInput(index + 1);
      }
    },
    [value, onChange, length, focusInput]
  );

  const handleKeyDown = useCallback(
    (index: number, event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Backspace') {
        event.preventDefault();
        const digits = value.split('');
        while (digits.length < length) digits.push('');

        if (digits[index]) {
          digits[index] = '';
          onChange(digits.join(''));
        } else if (index > 0) {
          digits[index - 1] = '';
          onChange(digits.join(''));
          focusInput(index - 1);
        }
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        focusInput(index - 1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        focusInput(index + 1);
      }
    },
    [value, onChange, length, focusInput]
  );

  const handlePaste = useCallback(
    (event: ClipboardEvent<HTMLInputElement>) => {
      event.preventDefault();
      const pasted = event.clipboardData
        .getData('text')
        .replace(/\D/g, '')
        .slice(0, length);
      onChange(pasted);
      focusInput(Math.min(pasted.length, length) - 1);
    },
    [onChange, length, focusInput]
  );

  return (
    <div className="flex items-center justify-center gap-2" role="group" aria-label="OTP input">
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] ?? ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          aria-label={`Digit ${index + 1}`}
          className={cn(
            'h-12 w-10 rounded-xl text-center text-lg font-semibold',
            'bg-background/50 dark:bg-background/30',
            'backdrop-blur-sm',
            'border transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary/50',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-destructive/50 focus:border-destructive'
              : 'border-border/50 focus:border-primary/50'
          )}
        />
      ))}
    </div>
  );
}
