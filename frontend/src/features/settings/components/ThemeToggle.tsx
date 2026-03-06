import { Sun, Moon, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';
import { useThemeStore } from '../stores/themeStore';
import { springTransition } from '@/shared/lib/motion';

type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

const THEME_OPTIONS: Array<{
  value: ThemePreference;
  icon: typeof Sun;
  label: string;
}> = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
  { value: 'system', icon: Monitor, label: 'System' },
];

export function ThemeToggle({ showLabel = false, className }: ThemeToggleProps) {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-xl p-1',
        'bg-muted/50 border border-border/50',
        className
      )}
      role="radiogroup"
      aria-label="Theme preference"
    >
      {THEME_OPTIONS.map(({ value, icon: Icon, label }) => {
        const isActive = theme === value;

        return (
          <button
            key={value}
            role="radio"
            aria-checked={isActive}
            aria-label={`${label} theme`}
            onClick={() => setTheme(value)}
            className={cn(
              'relative flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm',
              'transition-colors duration-200',
              isActive
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {isActive && (
              <motion.div
                layoutId="theme-indicator"
                className="absolute inset-0 rounded-lg bg-background shadow-sm border border-border/50"
                transition={springTransition}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Icon className="h-4 w-4" />
              {showLabel && <span>{label}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
