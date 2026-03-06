import type { UserRole } from '@/shared/types/api.types';
import { cn } from '@/shared/lib/utils';

const ROLE_CONFIG: Record<UserRole, { label: string; className: string }> = {
  owner: { label: 'Owner', className: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' },
  admin: { label: 'Admin', className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' },
  member: { label: 'Member', className: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' },
  viewer: { label: 'Viewer', className: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300' },
  superadmin: { label: 'Super Admin', className: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' },
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
