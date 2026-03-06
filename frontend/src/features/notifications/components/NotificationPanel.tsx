import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BellOff, CheckCheck, Loader2, Settings } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { slideDownVariants } from '@/shared/lib/motion';
import { ROUTES } from '@/shared/constants/routes';
import { useNotifications } from '../hooks/useNotifications';
import { useMarkRead, useMarkAllRead } from '../hooks/useNotificationMutations';
import { NotificationItem } from './NotificationItem';
import type { Notification } from '../types/notification.types';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const navigate = useNavigate();
  const observerRef = useRef<HTMLDivElement>(null);

  const {
    data: notificationsData,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useNotifications(isOpen);

  const markReadMutation = useMarkRead();
  const markAllReadMutation = useMarkAllRead();

  const notifications =
    notificationsData?.pages.flatMap((page) => page.data) ?? [];

  // Infinite scroll observer
  useEffect(() => {
    if (!isOpen || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.5 }
    );

    const currentRef = observerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [isOpen, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      onClose();

      if (notification.entityType && notification.entityId) {
        switch (notification.entityType) {
          case 'task':
            navigate(`/tasks?taskId=${notification.entityId}`);
            break;
          case 'project':
            navigate(`/projects/${notification.entityId}`);
            break;
          default:
            break;
        }
      }
    },
    [navigate, onClose]
  );

  const handleMarkRead = useCallback(
    (id: string) => {
      markReadMutation.mutate(id);
    },
    [markReadMutation]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={slideDownVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className={cn(
            'absolute right-0 top-full z-50 mt-2',
            'max-h-[32rem] w-96',
            'rounded-xl border border-border/50',
            'bg-background/90 dark:bg-background/80',
            'backdrop-blur-2xl',
            'shadow-lg shadow-black/10 dark:shadow-black/30',
            'flex flex-col overflow-hidden'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/30 px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">
              Notifications
            </h3>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button
                  onClick={() => markAllReadMutation.mutate()}
                  disabled={markAllReadMutation.isPending}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Mark all read</span>
                </button>
              )}
              <button
                onClick={() => {
                  onClose();
                  navigate(ROUTES.PROFILE);
                }}
                className="text-muted-foreground hover:text-foreground"
                title="Notification settings"
              >
                <Settings className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-12">
                <BellOff className="h-8 w-8 text-muted-foreground/30" />
                <p className="mt-3 text-sm font-medium text-foreground">
                  All caught up
                </p>
                <p className="mt-1 text-center text-xs text-muted-foreground">
                  No new notifications. We will let you know when something
                  needs your attention.
                </p>
              </div>
            ) : (
              <div className="p-1">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification._id}
                    notification={notification}
                    onMarkRead={handleMarkRead}
                    onClick={handleNotificationClick}
                  />
                ))}

                {/* Infinite scroll trigger */}
                {hasNextPage && (
                  <div ref={observerRef} className="flex justify-center py-3">
                    {isFetchingNextPage ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Scroll for more
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
