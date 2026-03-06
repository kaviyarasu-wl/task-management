import { useTaskRealtime } from '@/features/tasks/hooks/useTaskRealtime';
import { useStatusRealtime } from '@/features/statuses/hooks/useStatusRealtime';
import { useNotificationRealtime } from '@/features/notifications/hooks/useNotificationRealtime';

interface RealtimeProviderProps {
  children: React.ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  // Initialize all real-time hooks
  useTaskRealtime();
  useStatusRealtime();
  useNotificationRealtime();

  return <>{children}</>;
}
