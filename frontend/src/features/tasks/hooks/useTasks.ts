import { useInfiniteQuery } from '@tanstack/react-query';
import { taskApi, type TaskFilters } from '../services/taskApi';

export function useTasks(filters: Omit<TaskFilters, 'cursor'> = {}) {
  return useInfiniteQuery({
    queryKey: ['tasks', filters],
    queryFn: ({ pageParam }) =>
      taskApi.getTasks({ ...filters, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 1000 * 60, // 1 minute
  });
}
