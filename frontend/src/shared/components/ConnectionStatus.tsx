import { Wifi, WifiOff } from 'lucide-react';
import { useSocket } from '@/shared/contexts/SocketContext';
import { cn } from '@/shared/lib/utils';

interface ConnectionStatusProps {
  showLabel?: boolean;
  className?: string;
}

export function ConnectionStatus({ showLabel = false, className }: ConnectionStatusProps) {
  const { isConnected } = useSocket();

  return (
    <div
      className={cn('flex items-center gap-2', className)}
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded-full',
          isConnected ? 'bg-green-100' : 'bg-red-100'
        )}
        aria-hidden="true"
      >
        {isConnected ? (
          <Wifi className="h-3 w-3 text-green-600" />
        ) : (
          <WifiOff className="h-3 w-3 text-red-600" />
        )}
      </div>
      {showLabel && (
        <span
          className={cn(
            'text-sm',
            isConnected ? 'text-green-600' : 'text-red-600'
          )}
        >
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      )}
      {!showLabel && (
        <span className="sr-only">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      )}
    </div>
  );
}
