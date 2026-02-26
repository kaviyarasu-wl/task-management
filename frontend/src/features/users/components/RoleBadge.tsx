import type { UserRole } from '@/shared/types/api.types';
import { cn } from '@/shared/lib/utils';

const ROLE_CONFIG: Record<UserRole, { label: string; className: string }> = {
  owner: { label: 'Owner', className: 'bg-purple-100 text-purple-800' },
  admin: { label: 'Admin', className: 'bg-blue-100 text-blue-800' },
  member: { label: 'Member', className: 'bg-green-100 text-green-800' },
  viewer: { label: 'Viewer', className: 'bg-gray-100 text-gray-800' },
};

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = ROLE_CONFIG[role];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
