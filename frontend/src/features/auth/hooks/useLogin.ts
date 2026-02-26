import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../services/authApi';
import type { LoginCredentials } from '../types/auth.types';
import type { ApiError, UserRole } from '@/shared/types/api.types';

export function useLogin() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (response) => {
      const { user, accessToken, refreshToken } = response.data;
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
      console.error('Login failed:', error.response?.data?.message);
    },
  });
}
