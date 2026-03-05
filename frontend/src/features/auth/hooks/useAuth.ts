import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../services/authApi';
import { adminAuthApi } from '@/features/admin/services/adminAuthApi';
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

      // During impersonation, the active token is a special admin JWT
      // that won't work with standard identity endpoints. Use persisted state.
      const isCurrentlyImpersonating = useAuthStore.getState().impersonatedTenant !== null;
      if (isCurrentlyImpersonating) {
        setLoading(false);
        return;
      }

      try {
        const persistedUser = useAuthStore.getState().user;
        const isSuperAdmin = persistedUser?.role === 'superadmin';
        const response = isSuperAdmin
          ? await adminAuthApi.getMe()
          : await authApi.getMe();
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
    const isSuperAdmin = useAuthStore.getState().user?.role === 'superadmin';
    try {
      if (isSuperAdmin) {
        await adminAuthApi.logout();
      } else {
        await authApi.logout();
      }
    } catch {
      // Ignore logout errors
    } finally {
      clearAuth();
      navigate(isSuperAdmin ? ROUTES.ADMIN_LOGIN : ROUTES.LOGIN);
    }
  }, [clearAuth, navigate]);

  return {
    user,
    isAuthenticated,
    isLoading,
    logout,
  };
}
