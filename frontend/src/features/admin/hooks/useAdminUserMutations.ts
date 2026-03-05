import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminUsersApi } from '../services/adminUsersApi';
import { toast } from '@/shared/stores/toastStore';

export function useAdminUserMutations() {
  const queryClient = useQueryClient();

  const updateUser = useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: { firstName?: string; lastName?: string; role?: string };
    }) => adminUsersApi.update(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({ type: 'success', title: 'User updated' });
    },
    onError: (error: any) => {
      toast({
        type: 'error',
        title: error.response?.data?.message || 'Failed to update user',
      });
    },
  });

  const moveUser = useMutation({
    mutationFn: ({
      userId,
      targetTenantId,
      newRole,
    }: {
      userId: string;
      targetTenantId: string;
      newRole?: string;
    }) => adminUsersApi.moveToTenant(userId, targetTenantId, newRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({ type: 'success', title: 'User moved to new tenant' });
    },
    onError: (error: any) => {
      toast({
        type: 'error',
        title: error.response?.data?.message || 'Failed to move user',
      });
    },
  });

  const deleteUser = useMutation({
    mutationFn: adminUsersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({ type: 'success', title: 'User deleted permanently' });
    },
    onError: (error: any) => {
      toast({
        type: 'error',
        title: error.response?.data?.message || 'Failed to delete user',
      });
    },
  });

  const resetPassword = useMutation({
    mutationFn: adminUsersApi.resetPassword,
    onSuccess: (data) => {
      toast({
        type: 'success',
        title: `Password reset. Temp password: ${data.tempPassword}`,
        duration: 10000,
      });
    },
    onError: (error: any) => {
      toast({
        type: 'error',
        title: error.response?.data?.message || 'Failed to reset password',
      });
    },
  });

  return { updateUser, moveUser, deleteUser, resetPassword };
}
