import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/features/auth';
import { useUpdateProfile, useChangePassword } from '@/features/users/hooks/useUserMutations';
import {
  updateProfileSchema,
  changePasswordSchema,
  type UpdateProfileFormData,
  type ChangePasswordFormData,
} from '@/features/users/validators/user.validators';
import { RoleBadge } from '@/features/users/components/RoleBadge';
import { cn, getInitials, formatDate } from '@/shared/lib/utils';

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
    },
  });

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onProfileSubmit = (data: UpdateProfileFormData) => {
    setProfileSuccess(false);
    updateProfileMutation.mutate(data, {
      onSuccess: () => {
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
      },
    });
  };

  const onPasswordSubmit = (data: ChangePasswordFormData) => {
    setPasswordSuccess(false);
    changePasswordMutation.mutate(
      { currentPassword: data.currentPassword, newPassword: data.newPassword },
      {
        onSuccess: () => {
          setPasswordSuccess(true);
          resetPassword();
          setTimeout(() => setPasswordSuccess(false), 3000);
        },
      }
    );
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground">Profile</h1>

      {/* User Info Card */}
      <div className="mt-6 rounded-lg border border-border bg-background p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-medium text-primary-foreground">
            {getInitials(user.firstName, user.lastName)}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-muted-foreground">{user.email}</p>
            <div className="mt-1 flex items-center gap-2">
              <RoleBadge role={user.role} />
              {user.createdAt && (
                <span className="text-sm text-muted-foreground">
                  Joined {formatDate(user.createdAt)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="mt-6 rounded-lg border border-border bg-background p-6">
        <h3 className="text-lg font-semibold text-foreground">Update Profile</h3>

        <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="mt-4 space-y-4">
          {profileSuccess && (
            <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-800">
              <Check className="h-4 w-4" />
              Profile updated successfully
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium">
                First name
              </label>
              <input
                {...registerProfile('firstName')}
                type="text"
                id="firstName"
                className={cn(
                  'mt-1 block w-full rounded-md border border-border bg-background px-3 py-2',
                  'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
                  profileErrors.firstName && 'border-destructive'
                )}
              />
              {profileErrors.firstName && (
                <p className="mt-1 text-sm text-destructive">
                  {profileErrors.firstName.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium">
                Last name
              </label>
              <input
                {...registerProfile('lastName')}
                type="text"
                id="lastName"
                className={cn(
                  'mt-1 block w-full rounded-md border border-border bg-background px-3 py-2',
                  'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
                  profileErrors.lastName && 'border-destructive'
                )}
              />
              {profileErrors.lastName && (
                <p className="mt-1 text-sm text-destructive">
                  {profileErrors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className={cn(
              'flex items-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground',
              'hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            {updateProfileMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Changes
          </button>
        </form>
      </div>

      {/* Password Form */}
      <div className="mt-6 rounded-lg border border-border bg-background p-6">
        <h3 className="text-lg font-semibold text-foreground">Change Password</h3>

        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="mt-4 space-y-4">
          {passwordSuccess && (
            <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-800">
              <Check className="h-4 w-4" />
              Password changed successfully
            </div>
          )}

          {changePasswordMutation.isError && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {(changePasswordMutation.error as any)?.response?.data?.message ||
                'Failed to change password'}
            </div>
          )}

          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium">
              Current password
            </label>
            <input
              {...registerPassword('currentPassword')}
              type="password"
              id="currentPassword"
              className={cn(
                'mt-1 block w-full rounded-md border border-border bg-background px-3 py-2',
                'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
                passwordErrors.currentPassword && 'border-destructive'
              )}
            />
            {passwordErrors.currentPassword && (
              <p className="mt-1 text-sm text-destructive">
                {passwordErrors.currentPassword.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium">
              New password
            </label>
            <input
              {...registerPassword('newPassword')}
              type="password"
              id="newPassword"
              className={cn(
                'mt-1 block w-full rounded-md border border-border bg-background px-3 py-2',
                'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
                passwordErrors.newPassword && 'border-destructive'
              )}
            />
            {passwordErrors.newPassword && (
              <p className="mt-1 text-sm text-destructive">
                {passwordErrors.newPassword.message}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Min 8 characters, 1 uppercase, 1 number
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium">
              Confirm new password
            </label>
            <input
              {...registerPassword('confirmPassword')}
              type="password"
              id="confirmPassword"
              className={cn(
                'mt-1 block w-full rounded-md border border-border bg-background px-3 py-2',
                'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
                passwordErrors.confirmPassword && 'border-destructive'
              )}
            />
            {passwordErrors.confirmPassword && (
              <p className="mt-1 text-sm text-destructive">
                {passwordErrors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={changePasswordMutation.isPending}
            className={cn(
              'flex items-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground',
              'hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            {changePasswordMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Change Password
          </button>
        </form>
      </div>
    </div>
  );
}
