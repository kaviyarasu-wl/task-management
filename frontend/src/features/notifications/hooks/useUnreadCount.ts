import { useQuery } from '@tanstack/react-query';
import { notificationApi } from '../services/notificationApi';

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationApi.getUnreadCount(),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
    select: (data) => data.data.count,
  });
}
