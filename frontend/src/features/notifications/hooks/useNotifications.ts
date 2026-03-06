import { useInfiniteQuery } from '@tanstack/react-query';
import { notificationApi } from '../services/notificationApi';

export function useNotifications(enabled = true) {
  return useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: ({ pageParam }) => notificationApi.list(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
    staleTime: 1000 * 60,
  });
}
