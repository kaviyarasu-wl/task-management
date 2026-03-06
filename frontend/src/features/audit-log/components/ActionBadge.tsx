import { Badge } from '@/shared/components/ui/Badge';
import type { AuditAction } from '../types/audit-log.types';

const ACTION_BADGE_MAP: Record<AuditAction, { variant: 'success' | 'info' | 'destructive' | 'warning' | 'secondary'; label: string }> = {
  create: { variant: 'success', label: 'Created' },
  update: { variant: 'info', label: 'Updated' },
  delete: { variant: 'destructive', label: 'Deleted' },
  login: { variant: 'secondary', label: 'Login' },
  logout: { variant: 'secondary', label: 'Logout' },
  invite: { variant: 'warning', label: 'Invited' },
  role_change: { variant: 'warning', label: 'Role Changed' },
};

interface ActionBadgeProps {
  action: AuditAction;
}

export function ActionBadge({ action }: ActionBadgeProps) {
  const config = ACTION_BADGE_MAP[action] ?? { variant: 'secondary' as const, label: action };

  return (
    <Badge variant={config.variant} size="sm">
      {config.label}
    </Badge>
  );
}
