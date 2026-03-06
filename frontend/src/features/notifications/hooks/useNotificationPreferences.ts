import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../services/notificationApi';
import type { NotificationPreferencesUpdate } from '../types/notification.types';

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ['notifications', 'preferences'],
    queryFn: () => notificationApi.getPreferences(),
    staleTime: 1000 * 60 * 5,
    select: (data) => data.data,
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (update: NotificationPreferencesUpdate) =>
      notificationApi.updatePreferences(update),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['notifications', 'preferences'],
      });
    },
  });
}
