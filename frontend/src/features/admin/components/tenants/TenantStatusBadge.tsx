import { Badge } from '@/shared/components/ui/Badge';

interface TenantStatusBadgeProps {
  isActive: boolean;
  suspendedAt?: string;
}

export function TenantStatusBadge({ isActive, suspendedAt }: TenantStatusBadgeProps) {
  if (suspendedAt) {
    return <Badge variant="destructive">Suspended</Badge>;
  }

  if (isActive) {
    return <Badge variant="success">Active</Badge>;
  }

  return <Badge variant="secondary">Inactive</Badge>;
}
