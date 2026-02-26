import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '@infrastructure/redis/client';
import { config } from '../../config';
import { TooManyRequestsError } from '@core/errors/AppError';
import { TenantPlan } from '../../types';

const PLAN_LIMITS: Record<TenantPlan, number> = {
  free: config.RATE_LIMIT_FREE,
  pro: config.RATE_LIMIT_PRO,
  enterprise: config.RATE_LIMIT_ENTERPRISE,
};

/**
 * Per-tenant sliding window rate limiter using Redis INCR.
 * Key expires automatically — no cleanup job needed.
 *
 * Window: fixed at 1 minute (configurable via env)
 * Limit: based on tenant plan (free/pro/enterprise)
 */
export function rateLimitMiddleware(plan: TenantPlan = 'free') {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = req.user?.tenantId;

    // Skip rate limiting if no tenant context (unauthenticated routes)
    if (!tenantId) {
      next();
      return;
    }

    const windowMs = config.RATE_LIMIT_WINDOW_MS;
    const windowStart = Math.floor(Date.now() / windowMs);
    const key = `ratelimit:${tenantId}:${windowStart}`;
    const limit = PLAN_LIMITS[plan];

    try {
      const redis = getRedisClient();
      const current = await redis.incr(key);

      // Set TTL on first request in this window
      if (current === 1) {
        await redis.expire(key, Math.ceil(windowMs / 1000));
      }

      // Set headers so clients know their rate limit status
      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - current));
      res.setHeader('X-RateLimit-Reset', (windowStart + 1) * windowMs);

      if (current > limit) {
        next(new TooManyRequestsError(`Rate limit exceeded. Limit: ${limit} requests per minute`));
        return;
      }

      next();
    } catch (err) {
      // Redis failure should not block requests — degrade gracefully
      console.error('[RateLimit] Redis error, skipping rate limit:', err);
      next();
    }
  };
}
