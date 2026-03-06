import { useMemo } from 'react';
import { useAuthStore } from '@/features/auth/stores/authStore';

/**
 * Check if the current user has a specific permission or set of permissions.
 *
 * Usage:
 *   const canCreateTask = useHasPermission('tasks.create');
 *   const canManageTeam = useHasPermission(['members.invite', 'members.remove'], 'any');
 *   const hasAllAdmin = useHasPermission(['settings.read', 'settings.update'], 'all');
 */
export function useHasPermission(
  permission: string | string[],
  mode: 'any' | 'all' = 'all'
): boolean {
  const user = useAuthStore((state) => state.user);

  return useMemo(() => {
    if (!user) return false;

    // Owner and superadmin always have all permissions
    if (user.role === 'owner' || user.role === 'superadmin') {
      return true;
    }

    const userPermissions = new Set(user.permissions ?? []);

    if (typeof permission === 'string') {
      return userPermissions.has(permission);
    }

    if (mode === 'any') {
      return permission.some((p) => userPermissions.has(p));
    }

    return permission.every((p) => userPermissions.has(p));
  }, [user, permission, mode]);
}

/**
 * Imperative permission check (for use outside React components).
 */
export function hasPermission(
  permission: string | string[],
  mode: 'any' | 'all' = 'all'
): boolean {
  const user = useAuthStore.getState().user;
  if (!user) return false;
  if (user.role === 'owner' || user.role === 'superadmin') return true;

  const userPermissions = new Set(user.permissions ?? []);

  if (typeof permission === 'string') {
    return userPermissions.has(permission);
  }

  return mode === 'any'
    ? permission.some((p) => userPermissions.has(p))
    : permission.every((p) => userPermissions.has(p));
}
