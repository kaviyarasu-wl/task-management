import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleApi } from '../services/roleApi';
import type { CreateRoleData, UpdateRoleData } from '../types/role.types';
import { toast } from '@/shared/stores/toastStore';

const ROLES_KEY = ['roles'] as const;
const PERMISSIONS_KEY = ['permissions'] as const;

export function useRoles() {
  return useQuery({
    queryKey: ROLES_KEY,
    queryFn: () => roleApi.list(),
    select: (response) => response.data,
    staleTime: 1000 * 60 * 5,
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: PERMISSIONS_KEY,
    queryFn: () => roleApi.getPermissions(),
    select: (response) => response.data,
    staleTime: 1000 * 60 * 30,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRoleData) => roleApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROLES_KEY });
      toast({ type: 'success', title: 'Role created' });
    },
    onError: () => {
      toast({ type: 'error', title: 'Failed to create role' });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, data }: { roleId: string; data: UpdateRoleData }) =>
      roleApi.update(roleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROLES_KEY });
      toast({ type: 'success', title: 'Role updated' });
    },
    onError: () => {
      toast({ type: 'error', title: 'Failed to update role' });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleId: string) => roleApi.delete(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROLES_KEY });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast({ type: 'success', title: 'Role deleted' });
    },
    onError: () => {
      toast({ type: 'error', title: 'Failed to delete role' });
    },
  });
}
