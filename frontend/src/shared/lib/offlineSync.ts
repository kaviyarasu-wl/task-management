import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { taskApi } from '@/features/tasks/services/taskApi';
import {
  useOfflineQueueStore,
  type QueuedMutation,
} from '../stores/offlineQueueStore';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { toast } from '../stores/toastStore';
import type { CreateTaskData, UpdateTaskData } from '@/features/tasks/services/taskApi';

const MAX_RETRIES = 3;

async function executeMutation(mutation: QueuedMutation): Promise<boolean> {
  try {
    switch (mutation.type) {
      case 'create_task':
        await taskApi.createTask(mutation.payload as unknown as CreateTaskData);
        return true;
      case 'update_task': {
        const { taskId, data } = mutation.payload as { taskId: string; data: UpdateTaskData };
        await taskApi.updateTask(taskId, data);
        return true;
      }
      default:
        return false;
    }
  } catch {
    return false;
  }
}

/**
 * Listens for online status changes and replays queued mutations.
 * Place in AppLayout or a top-level provider.
 */
export function useOfflineSync() {
  const { isOnline, wasOffline } = useOnlineStatus();
  const queryClient = useQueryClient();
  const queue = useOfflineQueueStore((s) => s.queue);
  const removeFromQueue = useOfflineQueueStore((s) => s.removeFromQueue);
  const incrementRetry = useOfflineQueueStore((s) => s.incrementRetry);

  const processQueue = useCallback(async () => {
    if (queue.length === 0) return;

    let successCount = 0;
    let failCount = 0;

    for (const mutation of queue) {
      if (mutation.retryCount >= MAX_RETRIES) {
        removeFromQueue(mutation.id);
        failCount++;
        continue;
      }

      const isSuccessful = await executeMutation(mutation);

      if (isSuccessful) {
        removeFromQueue(mutation.id);
        successCount++;
      } else {
        incrementRetry(mutation.id);
        failCount++;
      }
    }

    if (successCount > 0) {
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        type: 'success',
        title: `${successCount} change${successCount > 1 ? 's' : ''} synced`,
      });
    }

    if (failCount > 0) {
      toast({
        type: 'warning',
        title: `${failCount} change${failCount > 1 ? 's' : ''} failed to sync`,
        message: 'These will be retried automatically',
      });
    }
  }, [queue, removeFromQueue, incrementRetry, queryClient]);

  useEffect(() => {
    if (wasOffline && isOnline && queue.length > 0) {
      processQueue();
    }
  }, [wasOffline, isOnline, queue.length, processQueue]);
}
