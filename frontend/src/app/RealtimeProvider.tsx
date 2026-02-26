import { useTaskRealtime } from '@/features/tasks/hooks/useTaskRealtime';

interface RealtimeProviderProps {
  children: React.ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  // Initialize all real-time hooks
  useTaskRealtime();

  return <>{children}</>;
}
