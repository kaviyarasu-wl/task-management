import { useQuery } from '@tanstack/react-query';
import { taskApi } from '../services/taskApi';

export function useTask(taskId: string | undefined) {
  return useQuery({
    queryKey: ['task', taskId],
    queryFn: () => taskApi.getTask(taskId!),
    enabled: !!taskId,
    staleTime: 1000 * 60, // 1 minute
    select: (data) => data.data,
  });
}
