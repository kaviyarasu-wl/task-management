import { memo, useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/shared/lib/utils';
import { pulseVariants } from '@/shared/lib/motion';
import { useUnreadCount } from '../hooks/useUnreadCount';
import { NotificationPanel } from './NotificationPanel';

export const NotificationBell = memo(function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: unreadCount = 0 } = useUnreadCount();

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative rounded-lg p-2 transition-colors',
          'hover:bg-muted/50',
          isOpen && 'bg-muted/50'
        )}
        aria-label={
          unreadCount > 0
            ? `Notifications (${unreadCount} unread)`
            : 'Notifications'
        }
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="h-5 w-5 text-muted-foreground" />

        {/* Unread badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              variants={pulseVariants}
              initial="initial"
              animate="animate"
              exit={{ scale: 0, opacity: 0 }}
              aria-hidden="true"
              className={cn(
                'absolute -right-0.5 -top-0.5',
                'flex h-5 min-w-[20px] items-center justify-center',
                'rounded-full bg-destructive px-1',
                'text-[10px] font-bold text-destructive-foreground'
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Screen reader live announcement for count changes */}
        <span className="sr-only" aria-live="polite">
          {unreadCount > 0
            ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
            : 'No unread notifications'}
        </span>
      </button>

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
});
NotificationBell.displayName = 'NotificationBell';
