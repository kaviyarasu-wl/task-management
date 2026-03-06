import { AsyncLocalStorage } from 'async_hooks';
import { UserRole } from '../../types';
import { ApiKeyPermission } from '@modules/apiKey/apiKey.model';

export interface RequestContext {
  userId: string;
  tenantId: string;
  email: string;
  role: UserRole;
  requestId: string;
  /** User's preferred locale for i18n */
  locale: string;
  /** Set when request is authenticated via API key */
  apiKeyId?: string;
  /** API key permissions - only set for API key authenticated requests */
  permissions?: ApiKeyPermission[];
  /** User's role permissions loaded from Role collection */
  rolePermissions?: string[];
  /** Set when a superadmin is impersonating a tenant user */
  isImpersonating?: boolean;
  /** Original superadmin ID when impersonating */
  originalAdminId?: string;
  /** Impersonation log ID for audit tracking */
  impersonationLogId?: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

export const RequestContext = {
  /**
   * Run a callback with a given context. All async operations
   * inside the callback (even across multiple await boundaries)
   * will have access to this context.
   */
  run<T>(context: RequestContext, callback: () => T): T {
    return storage.run(context, callback);
  },

  /**
   * Get the current request context. Throws if called outside
   * a request lifecycle (e.g., in a background job without context).
   */
  get(): RequestContext {
    const ctx = storage.getStore();
    if (!ctx) {
      throw new Error('RequestContext accessed outside of request lifecycle');
    }
    return ctx;
  },

  /**
   * Safe get — returns null if no context. Use in code that may
   * run both inside and outside request context.
   */
  getOptional(): RequestContext | null {
    return storage.getStore() ?? null;
  },

  getTenantId(): string {
    return RequestContext.get().tenantId;
  },

  getUserId(): string {
    return RequestContext.get().userId;
  },

  getRole(): UserRole {
    return RequestContext.get().role;
  },

  /**
   * Check if current request is authenticated via API key
   */
  isApiKeyAuth(): boolean {
    const ctx = RequestContext.getOptional();
    return ctx?.apiKeyId !== undefined;
  },

  /**
   * Get API key ID if authenticated via API key, null otherwise
   */
  getApiKeyId(): string | null {
    const ctx = RequestContext.getOptional();
    return ctx?.apiKeyId ?? null;
  },

  /**
   * Get API key permissions if authenticated via API key
   */
  getPermissions(): ApiKeyPermission[] | null {
    const ctx = RequestContext.getOptional();
    return ctx?.permissions ?? null;
  },

  /**
   * Check if current request is from an impersonating superadmin
   */
  isImpersonating(): boolean {
    const ctx = RequestContext.getOptional();
    return ctx?.isImpersonating === true;
  },

  /**
   * Get original admin ID if impersonating, null otherwise
   */
  getOriginalAdminId(): string | null {
    const ctx = RequestContext.getOptional();
    return ctx?.originalAdminId ?? null;
  },

  /**
   * Get impersonation log ID if impersonating, null otherwise
   */
  getImpersonationLogId(): string | null {
    const ctx = RequestContext.getOptional();
    return ctx?.impersonationLogId ?? null;
  },
};
