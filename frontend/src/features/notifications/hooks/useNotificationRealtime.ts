import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/shared/contexts/SocketContext';
import { toast } from '@/shared/stores/toastStore';
import type { Notification } from '../types/notification.types';

export function useNotificationRealtime() {
  const { on, off, isConnected } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isConnected) return;

    const handleNewNotification = ({
      notification,
    }: {
      notification: Notification;
    }) => {
      console.log('[Realtime] New notification:', notification._id);

      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({
        queryKey: ['notifications', 'unread-count'],
      });

      toast({
        type: 'info',
        title: notification.title,
        message: notification.message,
        duration: 6000,
      });
    };

    on('notification:new', handleNewNotification);

    return () => {
      off('notification:new', handleNewNotification);
    };
  }, [isConnected, on, off, queryClient]);
}
