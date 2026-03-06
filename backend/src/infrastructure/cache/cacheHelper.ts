import { cache } from '@infrastructure/redis/cache';
import { config } from '../../config';
import { createLogger } from '@infrastructure/logger';

const log = createLogger('CacheHelper');

/**
 * Build a tenant-scoped cache key.
 * Format: cache:{tenantId}:{namespace}:{identifier}
 *
 * Tenant isolation is baked in to prevent cross-tenant cache pollution.
 */
export function buildCacheKey(
  tenantId: string,
  namespace: string,
  identifier?: string
): string {
  const base = `cache:${tenantId}:${namespace}`;
  return identifier ? `${base}:${identifier}` : base;
}

/**
 * Generic cache-aside helper with configurable TTL per namespace.
 *
 * Usage:
 *   const statuses = await cachedQuery(
 *     tenantId, 'statuses', 'list',
 *     () => StatusModel.find({ tenantId }).exec(),
 *     config.CACHE_STATUS_TTL
 *   );
 */
export async function cachedQuery<T>(
  tenantId: string,
  namespace: string,
  identifier: string,
  fetcher: () => Promise<T>,
  ttlSeconds?: number
): Promise<T> {
  const key = buildCacheKey(tenantId, namespace, identifier);
  const ttl = ttlSeconds ?? config.CACHE_DEFAULT_TTL;

  return cache.getOrSet(key, fetcher, ttl);
}

/**
 * Invalidate all cache entries for a namespace within a tenant.
 * Call this on write operations (create, update, delete).
 *
 * Usage:
 *   await invalidateNamespace(tenantId, 'statuses');
 */
export async function invalidateNamespace(
  tenantId: string,
  namespace: string
): Promise<void> {
  try {
    await cache.delPattern(`cache:${tenantId}:${namespace}:*`);
  } catch {
    log.warn({ tenantId, namespace }, 'Failed to invalidate cache namespace');
  }
}

/**
 * Invalidate a specific cache entry.
 */
export async function invalidateKey(
  tenantId: string,
  namespace: string,
  identifier: string
): Promise<void> {
  const key = buildCacheKey(tenantId, namespace, identifier);
  try {
    await cache.del(key);
  } catch {
    log.warn({ tenantId, namespace, identifier }, 'Failed to invalidate cache key');
  }
}
