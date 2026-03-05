import { useQuery } from '@tanstack/react-query';
import { adminUsersApi } from '../services/adminUsersApi';
import type { UserSearchParams } from '../types/adminUser.types';

export function useAdminUsers(params?: UserSearchParams) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminUsersApi.search(params),
    placeholderData: (prev) => prev,
  });
}

export function useAdminUser(userId: string) {
  return useQuery({
    queryKey: ['admin', 'users', userId],
    queryFn: () => adminUsersApi.getById(userId),
    enabled: Boolean(userId),
  });
}
