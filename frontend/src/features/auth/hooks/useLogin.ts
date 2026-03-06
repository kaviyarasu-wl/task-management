import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../services/authApi';
import type { LoginCredentials } from '../types/auth.types';
import type { ApiError, UserRole } from '@/shared/types/api.types';
import { ROUTES } from '@/shared/constants/routes';

export function useLogin() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const setMfaRequired = useAuthStore((state) => state.setMfaRequired);

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (response) => {
      const { requiresMfa, mfaToken, user, accessToken, refreshToken } = response.data;

      if (requiresMfa && mfaToken) {
        setMfaRequired(mfaToken);
        navigate(ROUTES.MFA_VERIFY);
        return;
      }

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
