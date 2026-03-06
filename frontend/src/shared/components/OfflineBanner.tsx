import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, CloudOff } from 'lucide-react';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';
import { useOfflineQueueStore } from '@/shared/stores/offlineQueueStore';
import { slideDownVariants } from '@/shared/lib/motion';

export function OfflineBanner() {
  const { isOnline } = useOnlineStatus();
  const queueSize = useOfflineQueueStore((s) => s.queue.length);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          variants={slideDownVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-2 bg-amber-500/90 px-4 py-2 text-sm font-medium text-amber-950 backdrop-blur-sm"
          role="alert"
          aria-live="assertive"
        >
          <WifiOff className="h-4 w-4" />
          <span>You are offline</span>
          {queueSize > 0 && (
            <>
              <span className="mx-1">-</span>
              <CloudOff className="h-4 w-4" />
              <span>
                {queueSize} pending change{queueSize !== 1 ? 's' : ''} will sync when reconnected
              </span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
