import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useId,
  type ReactNode,
  type KeyboardEvent,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useKeyboardNavigation } from '@/shared/hooks/useKeyboardNavigation';
import {
  scaleVariants,
  staggerContainerVariants,
  staggerItemVariants,
  springTransition,
} from '@/shared/lib/motion';

interface DropdownItem {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
  onClick?: () => void;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

function Dropdown({ trigger, items, align = 'left', className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const triggerId = useId();

  const enabledItems = items.filter((item) => !item.disabled);

  const handleSelect = useCallback(
    (index: number) => {
      const item = enabledItems[index];
      if (item?.onClick) {
        item.onClick();
        setIsOpen(false);
      }
    },
    [enabledItems]
  );

  const { activeIndex, setActiveIndex, handleKeyDown, resetActiveIndex } =
    useKeyboardNavigation({
      itemCount: enabledItems.length,
      onSelect: handleSelect,
      onEscape: () => setIsOpen(false),
      loop: true,
    });

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      resetActiveIndex();
    }
  }, [isOpen, resetActiveIndex]);

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (
      event.key === 'ArrowDown' ||
      event.key === 'Enter' ||
      event.key === ' '
    ) {
      event.preventDefault();
      setIsOpen(true);
    }
  };

  const getEnabledIndex = (item: DropdownItem) => {
    return enabledItems.findIndex((i) => i.id === item.id);
  };

  return (
    <div ref={dropdownRef} className={cn('relative inline-block', className)}>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleTriggerKeyDown}
        className="inline-flex items-center"
      >
        {trigger}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={menuId}
            role="menu"
            aria-labelledby={triggerId}
            className={cn(
              'absolute z-50 mt-2 min-w-[180px] py-1',
              // Glassmorphism styling
              'bg-background/80 dark:bg-background/70',
              'backdrop-blur-xl',
              'border border-white/20 dark:border-white/10',
              'rounded-xl',
              'shadow-glass-lg',
              align === 'right' ? 'right-0' : 'left-0'
            )}
            variants={scaleVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onKeyDown={handleKeyDown}
          >
            {/* Gradient overlay */}
            <div
              className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 via-transparent to-white/5 pointer-events-none"
              aria-hidden="true"
            />

            <motion.div
              variants={staggerContainerVariants}
              initial="initial"
              animate="animate"
              className="relative"
            >
              {items.map((item) => {
                const enabledIndex = getEnabledIndex(item);
                const isActive = enabledIndex === activeIndex && !item.disabled;

                return (
                  <motion.button
                    key={item.id}
                    role="menuitem"
                    type="button"
                    disabled={item.disabled}
                    tabIndex={isActive ? 0 : -1}
                    variants={staggerItemVariants}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-sm text-left',
                      'transition-colors duration-150',
                      'focus:outline-none',
                      item.disabled
                        ? 'cursor-not-allowed opacity-50'
                        : 'cursor-pointer',
                      item.danger
                        ? 'text-destructive hover:bg-destructive/10'
                        : 'hover:bg-white/10 dark:hover:bg-white/5',
                      isActive && 'bg-white/10 dark:bg-white/5'
                    )}
                    onClick={() => {
                      if (!item.disabled && item.onClick) {
                        item.onClick();
                        setIsOpen(false);
                      }
                    }}
                    onMouseEnter={() => {
                      if (!item.disabled) {
                        setActiveIndex(enabledIndex);
                      }
                    }}
                  >
                    {item.icon && (
                      <span className="h-4 w-4 shrink-0" aria-hidden="true">
                        {item.icon}
                      </span>
                    )}
                    {item.label}
                  </motion.button>
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface DropdownButtonProps {
  children: ReactNode;
  items: DropdownItem[];
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function DropdownButton({
  children,
  items,
  variant = 'glass',
  size = 'md',
  className,
}: DropdownButtonProps) {
  const sizeClasses = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  };

  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'border border-border bg-background hover:bg-muted',
    ghost: 'hover:bg-muted/50',
    glass: [
      'bg-white/10 dark:bg-white/5',
      'backdrop-blur-lg',
      'border border-white/20 dark:border-white/10',
      'hover:bg-white/20 dark:hover:bg-white/10',
      'shadow-glass-sm',
    ].join(' '),
  };

  return (
    <Dropdown
      items={items}
      trigger={
        <motion.span
          className={cn(
            'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
            sizeClasses[size],
            variantClasses[variant],
            className
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={springTransition}
        >
          {children}
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </motion.span>
      }
    />
  );
}

export { Dropdown, DropdownButton };
export type { DropdownProps, DropdownItem };
