import type { UserRole } from '@/shared/types/api.types';

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateRoleData {
  role: UserRole;
}
