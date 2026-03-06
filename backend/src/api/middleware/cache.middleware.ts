import { Request, Response, NextFunction } from 'express';
import { cache } from '@infrastructure/redis/cache';
import { RequestContext } from '@core/context/RequestContext';

/**
 * Express middleware factory for caching GET responses in Redis.
 * Only caches successful (200) JSON responses.
 *
 * Adds `X-Cache: HIT` or `X-Cache: MISS` header for observability.
 *
 * Usage in routes:
 *   router.get('/statuses', cacheResponse('statuses', 3600), statusController.list);
 */
export function cacheResponse(namespace: string, ttlSeconds = 300) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      next();
      return;
    }

    const ctx = RequestContext.getOptional();
    if (!ctx) {
      next();
      return;
    }

    // Build cache key from tenant + URL + query params
    const queryString = JSON.stringify(req.query);
    const cacheKey = `http:${ctx.tenantId}:${namespace}:${req.path}:${queryString}`;

    try {
      const cached = await cache.get<string>(cacheKey);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Content-Type', 'application/json');
        res.send(cached);
        return;
      }
    } catch {
      // Cache miss or Redis error — fall through to handler
    }

    // Intercept res.json to cache the response body
    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      if (res.statusCode === 200) {
        const bodyString = JSON.stringify(body);
        cache.set(cacheKey, bodyString, ttlSeconds).catch(() => {
          // Silently fail — cache is best-effort
        });
      }

      res.setHeader('X-Cache', 'MISS');
      return originalJson(body);
    };

    next();
  };
}

/**
 * Invalidate all cached HTTP responses for a namespace within a tenant.
 * Call this in service write operations alongside service-level cache invalidation.
 */
export async function invalidateResponseCache(
  tenantId: string,
  namespace: string
): Promise<void> {
  await cache.delPattern(`http:${tenantId}:${namespace}:*`);
}
