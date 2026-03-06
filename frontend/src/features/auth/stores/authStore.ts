import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/shared/types/entities.types';

interface ImpersonatedTenant {
  tenantId: string;
  name: string;
  slug: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Impersonation state
  impersonatedTenant: ImpersonatedTenant | null;
  originalAccessToken: string | null;

  // MFA transient state (not persisted)
  mfaToken: string | null;
  isMfaRequired: boolean;

  // Actions
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;

  // MFA actions
  setMfaRequired: (mfaToken: string) => void;
  clearMfaRequired: () => void;

  // Impersonation actions
  startImpersonation: (tenant: ImpersonatedTenant, impersonationToken: string) => void;
  stopImpersonation: () => void;
  isImpersonating: () => boolean;
  isSuperAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,

      // Impersonation state
      impersonatedTenant: null,
      originalAccessToken: null,

      // MFA transient state
      mfaToken: null,
      isMfaRequired: false,

      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      setUser: (user) => set({ user }),

      setTokens: (accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ accessToken, refreshToken });
      },

      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('originalAccessToken');
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          // Clear impersonation state too
          impersonatedTenant: null,
          originalAccessToken: null,
        });
      },

      setLoading: (isLoading) => set({ isLoading }),

      // MFA actions
      setMfaRequired: (mfaToken) =>
        set({
          mfaToken,
          isMfaRequired: true,
        }),

      clearMfaRequired: () =>
        set({
          mfaToken: null,
          isMfaRequired: false,
        }),

      // Impersonation actions
      startImpersonation: (tenant, impersonationToken) => {
        const currentToken = get().accessToken;

        // Store original token to restore later
        localStorage.setItem('originalAccessToken', currentToken || '');
        // Set impersonation token as current
        localStorage.setItem('accessToken', impersonationToken);

        set({
          impersonatedTenant: tenant,
          originalAccessToken: currentToken,
          accessToken: impersonationToken,
        });
      },

      stopImpersonation: () => {
        const originalToken = get().originalAccessToken;

        if (originalToken) {
          // Restore original token
          localStorage.setItem('accessToken', originalToken);
        }
        localStorage.removeItem('originalAccessToken');

        set({
          impersonatedTenant: null,
          originalAccessToken: null,
          accessToken: originalToken,
        });
      },

      isImpersonating: () => get().impersonatedTenant !== null,

      isSuperAdmin: () => get().user?.role === 'superadmin',
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        // Persist impersonation state
        impersonatedTenant: state.impersonatedTenant,
        originalAccessToken: state.originalAccessToken,
      }),
    }
  )
);
