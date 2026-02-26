import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/shared/contexts/SocketContext';
import { toast } from '@/shared/stores/toastStore';

export function useTaskRealtime() {
  const { on, off, isConnected } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isConnected) return;

    const handleTaskCreated = ({ taskId }: { taskId: string }) => {
      console.log('[Realtime] Task created:', taskId);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    };

    const handleTaskUpdated = ({ taskId }: { taskId: string }) => {
      console.log('[Realtime] Task updated:', taskId);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
    };

    const handleTaskDeleted = ({ taskId }: { taskId: string }) => {
      console.log('[Realtime] Task deleted:', taskId);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    };

    const handleTaskAssigned = ({
      taskId,
      taskTitle,
    }: {
      taskId: string;
      taskTitle: string;
    }) => {
      console.log('[Realtime] Task assigned to you:', taskId);
      toast({
        type: 'info',
        title: 'Task Assigned',
        message: `You've been assigned to: ${taskTitle}`,
      });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    };

    const handleTaskCompleted = ({ taskId }: { taskId: string }) => {
      console.log('[Realtime] Task completed:', taskId);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    };

    on('task:created', handleTaskCreated);
    on('task:updated', handleTaskUpdated);
    on('task:deleted', handleTaskDeleted);
    on('task:assigned-to-you', handleTaskAssigned);
    on('task:completed', handleTaskCompleted);

    return () => {
      off('task:created', handleTaskCreated);
      off('task:updated', handleTaskUpdated);
      off('task:deleted', handleTaskDeleted);
      off('task:assigned-to-you', handleTaskAssigned);
      off('task:completed', handleTaskCompleted);
    };
  }, [isConnected, on, off, queryClient]);
}
