import { Badge } from '@/shared/components/ui/Badge';
import type { ConnectionStatus } from '../types/integration.types';

const STATUS_MAP: Record<
  ConnectionStatus,
  { variant: 'success' | 'secondary' | 'destructive' | 'warning'; label: string }
> = {
  active: { variant: 'success', label: 'Connected' },
  inactive: { variant: 'secondary', label: 'Inactive' },
  error: { variant: 'destructive', label: 'Error' },
  pending: { variant: 'warning', label: 'Pending' },
};

interface IntegrationStatusBadgeProps {
  status: ConnectionStatus;
}

export function IntegrationStatusBadge({ status }: IntegrationStatusBadgeProps) {
  const config = STATUS_MAP[status];

  return (
    <Badge variant={config.variant} size="sm">
      <span
        className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current"
        aria-hidden="true"
      />
      {config.label}
    </Badge>
  );
}
