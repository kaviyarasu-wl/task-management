import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { adminAuthApi } from '../services/adminAuthApi';
import type { AdminLoginCredentials } from '../types/adminAuth.types';
import type { ApiError } from '@/shared/types/api.types';
import { ROUTES } from '@/shared/constants/routes';

export function useAdminLogin() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (credentials: AdminLoginCredentials) => adminAuthApi.login(credentials),
    onSuccess: (response) => {
      const { admin, accessToken, refreshToken } = response.data;

      setAuth(
        {
          _id: admin._id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: 'superadmin',
          tenantId: '',
          isEmailVerified: true,
          createdAt: admin.createdAt?.toString() ?? '',
          updatedAt: admin.updatedAt?.toString() ?? '',
        },
        accessToken,
        refreshToken
      );

      navigate(ROUTES.ADMIN);
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Admin login failed:', error.response?.data?.message);
    },
  });
}
