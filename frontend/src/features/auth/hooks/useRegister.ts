import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../services/authApi';
import type { RegisterData } from '../types/auth.types';
import type { ApiError } from '@/shared/types/api.types';
import type { UserRole } from '@/shared/types/entities.types';

export function useRegister() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (data: RegisterData) => authApi.register(data),
    onSuccess: (response) => {
      const { user, accessToken, refreshToken } = response.data;

      // Set full auth state directly from register response
      setAuth(
        {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role as UserRole,
          tenantId: user.tenantId,
          isEmailVerified: false,
          createdAt: '',
          updatedAt: '',
        },
        accessToken,
        refreshToken
      );
      navigate('/dashboard');
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Registration failed:', error.response?.data?.message);
    },
  });
}
