import { AsyncLocalStorage } from 'async_hooks';
import { UserRole } from '../../types';

export interface RequestContext {
  userId: string;
  tenantId: string;
  email: string;
  role: UserRole;
  requestId: string;
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
};
