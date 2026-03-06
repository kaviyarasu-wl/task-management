import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../authStore';
import { createUser } from '@/__tests__/helpers';

// Reset store state between tests
beforeEach(() => {
  const store = useAuthStore.getState();
  store.logout();
  localStorage.clear();
  vi.clearAllMocks();
});

describe('authStore', () => {
  describe('initial state', () => {
    it('starts with null user and no authentication', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('starts with no MFA required', () => {
      const state = useAuthStore.getState();
      expect(state.mfaToken).toBeNull();
      expect(state.isMfaRequired).toBe(false);
    });

    it('starts with no impersonation', () => {
      const state = useAuthStore.getState();
      expect(state.impersonatedTenant).toBeNull();
      expect(state.originalAccessToken).toBeNull();
      expect(state.isImpersonating()).toBe(false);
    });
  });

  describe('setAuth', () => {
    it('sets user, tokens, and isAuthenticated', () => {
      const user = createUser();
      useAuthStore.getState().setAuth(user, 'access-123', 'refresh-456');

      const state = useAuthStore.getState();
      expect(state.user).toEqual(user);
      expect(state.accessToken).toBe('access-123');
      expect(state.refreshToken).toBe('refresh-456');
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('persists tokens to localStorage', () => {
      const user = createUser();
      useAuthStore.getState().setAuth(user, 'access-123', 'refresh-456');

      expect(localStorage.getItem('accessToken')).toBe('access-123');
      expect(localStorage.getItem('refreshToken')).toBe('refresh-456');
    });
  });

  describe('setUser', () => {
    it('updates user without affecting tokens', () => {
      const user = createUser();
      useAuthStore.getState().setAuth(user, 'access-123', 'refresh-456');

      const updatedUser = createUser({ firstName: 'Updated' });
      useAuthStore.getState().setUser(updatedUser);

      const state = useAuthStore.getState();
      expect(state.user?.firstName).toBe('Updated');
      expect(state.accessToken).toBe('access-123');
    });
  });

  describe('setTokens', () => {
    it('updates tokens in state and localStorage', () => {
      useAuthStore.getState().setTokens('new-access', 'new-refresh');

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('new-access');
      expect(state.refreshToken).toBe('new-refresh');
      expect(localStorage.getItem('accessToken')).toBe('new-access');
      expect(localStorage.getItem('refreshToken')).toBe('new-refresh');
    });
  });

  describe('logout', () => {
    it('clears all auth state', () => {
      const user = createUser();
      useAuthStore.getState().setAuth(user, 'access-123', 'refresh-456');
      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('removes tokens from localStorage', () => {
      const user = createUser();
      useAuthStore.getState().setAuth(user, 'access-123', 'refresh-456');
      useAuthStore.getState().logout();

      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });

    it('clears impersonation state', () => {
      const user = createUser();
      useAuthStore.getState().setAuth(user, 'access-123', 'refresh-456');
      useAuthStore.getState().startImpersonation(
        { tenantId: 't1', name: 'Test', slug: 'test' },
        'imp-token'
      );
      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.impersonatedTenant).toBeNull();
      expect(state.originalAccessToken).toBeNull();
    });
  });

  describe('setLoading', () => {
    it('sets loading state', () => {
      useAuthStore.getState().setLoading(true);
      expect(useAuthStore.getState().isLoading).toBe(true);

      useAuthStore.getState().setLoading(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('MFA actions', () => {
    it('setMfaRequired sets MFA token and flag', () => {
      useAuthStore.getState().setMfaRequired('mfa-token-123');

      const state = useAuthStore.getState();
      expect(state.mfaToken).toBe('mfa-token-123');
      expect(state.isMfaRequired).toBe(true);
    });

    it('clearMfaRequired resets MFA state', () => {
      useAuthStore.getState().setMfaRequired('mfa-token-123');
      useAuthStore.getState().clearMfaRequired();

      const state = useAuthStore.getState();
      expect(state.mfaToken).toBeNull();
      expect(state.isMfaRequired).toBe(false);
    });
  });

  describe('impersonation actions', () => {
    const tenant = { tenantId: 't1', name: 'Test Org', slug: 'test-org' };

    it('startImpersonation stores original token and sets impersonation', () => {
      const user = createUser();
      useAuthStore.getState().setAuth(user, 'original-token', 'refresh-456');
      useAuthStore.getState().startImpersonation(tenant, 'imp-token');

      const state = useAuthStore.getState();
      expect(state.impersonatedTenant).toEqual(tenant);
      expect(state.originalAccessToken).toBe('original-token');
      expect(state.accessToken).toBe('imp-token');
      expect(state.isImpersonating()).toBe(true);
    });

    it('stopImpersonation restores original token', () => {
      const user = createUser();
      useAuthStore.getState().setAuth(user, 'original-token', 'refresh-456');
      useAuthStore.getState().startImpersonation(tenant, 'imp-token');
      useAuthStore.getState().stopImpersonation();

      const state = useAuthStore.getState();
      expect(state.impersonatedTenant).toBeNull();
      expect(state.originalAccessToken).toBeNull();
      expect(state.accessToken).toBe('original-token');
      expect(state.isImpersonating()).toBe(false);
    });
  });

  describe('isSuperAdmin', () => {
    it('returns true for superadmin role', () => {
      const user = createUser({ role: 'superadmin' });
      useAuthStore.getState().setAuth(user, 'token', 'refresh');
      expect(useAuthStore.getState().isSuperAdmin()).toBe(true);
    });

    it('returns false for non-superadmin roles', () => {
      const user = createUser({ role: 'admin' });
      useAuthStore.getState().setAuth(user, 'token', 'refresh');
      expect(useAuthStore.getState().isSuperAdmin()).toBe(false);
    });

    it('returns false when no user', () => {
      expect(useAuthStore.getState().isSuperAdmin()).toBe(false);
    });
  });
});
