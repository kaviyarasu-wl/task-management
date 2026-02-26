import { useTaskRealtime } from '@/features/tasks/hooks/useTaskRealtime';
import { useStatusRealtime } from '@/features/statuses/hooks/useStatusRealtime';

interface RealtimeProviderProps {
  children: React.ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  // Initialize all real-time hooks
  useTaskRealtime();
  useStatusRealtime();

  return <>{children}</>;
}
