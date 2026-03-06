import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi, type CreateTaskData, type UpdateTaskData } from '../services/taskApi';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';
import { useOfflineQueueStore } from '@/shared/stores/offlineQueueStore';
import { toast } from '@/shared/stores/toastStore';

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { isOnline } = useOnlineStatus();
  const addToQueue = useOfflineQueueStore((s) => s.addToQueue);

  return useMutation({
    mutationFn: (data: CreateTaskData) => {
      if (!isOnline) {
        addToQueue({ type: 'create_task', payload: data as unknown as Record<string, unknown> });
        toast({ type: 'info', title: 'Task queued', message: 'Will be created when back online' });
        return Promise.resolve({
          success: true as const,
          data: { _id: `offline-${Date.now()}`, ...data } as never,
        });
      }
      return taskApi.createTask(data);
    },
    onSuccess: () => {
      if (isOnline) {
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      }
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  const { isOnline } = useOnlineStatus();
  const addToQueue = useOfflineQueueStore((s) => s.addToQueue);

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: UpdateTaskData }) => {
      if (!isOnline) {
        addToQueue({ type: 'update_task', payload: { taskId, data } });
        toast({ type: 'info', title: 'Update queued', message: 'Will sync when back online' });
        return Promise.resolve({
          success: true as const,
          data: { _id: taskId, ...data } as never,
        });
      }
      return taskApi.updateTask(taskId, data);
    },
    onSuccess: (_, variables) => {
      if (isOnline) {
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      }
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => taskApi.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
