import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../services/authApi';
import { ROUTES } from '@/shared/constants/routes';

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    setUser,
    logout: clearAuth,
    setLoading,
  } = useAuthStore();
  const navigate = useNavigate();

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await authApi.getMe();
        setUser(response.data);
        setLoading(false);
      } catch {
        clearAuth();
      }
    };

    if (isLoading) {
      initAuth();
    }
  }, [isLoading, setLoading, setUser, clearAuth]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    } finally {
      clearAuth();
      navigate(ROUTES.LOGIN);
    }
  }, [clearAuth, navigate]);

  return {
    user,
    isAuthenticated,
    isLoading,
    logout,
  };
}
