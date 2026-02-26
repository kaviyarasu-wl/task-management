import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../services/userApi';
import { useAuthStore } from '@/features/auth';
import type { UpdateUserData, ChangePasswordData, UpdateRoleData } from '../types/user.types';

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: (data: UpdateUserData) => userApi.updateMe(data),
    onSuccess: (response) => {
      setUser(response.data);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordData) => userApi.changePassword(data),
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateRoleData }) =>
      userApi.updateRole(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => userApi.removeMember(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
}
