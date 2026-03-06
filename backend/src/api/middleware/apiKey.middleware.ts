import { Request, Response, NextFunction } from 'express';
import { ApiKeyService } from '@modules/apiKey/apiKey.service';
import { ApiKeyPermission } from '@modules/apiKey/apiKey.model';
import { RequestContext } from '@core/context/RequestContext';
import { UnauthorizedError, ForbiddenError, TooManyRequestsError } from '@core/errors/AppError';
import { createLogger } from '@infrastructure/logger';

const log = createLogger('ApiKeyMiddleware');
import { getRedisClient } from '@infrastructure/redis/client';
import { randomUUID } from 'crypto';

const apiKeyService = new ApiKeyService();

/**
 * Authenticate requests using API key from X-API-Key header.
 * If valid, sets up RequestContext with tenant and user info.
 * Implements per-key rate limiting using Redis.
 */
export async function apiKeyAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const apiKeyHeader = req.headers['x-api-key'] as string | undefined;

  if (!apiKeyHeader) {
    next(new UnauthorizedError('API key required'));
    return;
  }

  try {
    const apiKey = await apiKeyService.verify(apiKeyHeader);

    if (!apiKey) {
      next(new UnauthorizedError('Invalid or expired API key'));
      return;
    }

    // Rate limiting check using Redis
    const redis = getRedisClient();
    const rateLimitKey = `ratelimit:apikey:${apiKey._id}`;
    const currentCount = await redis.incr(rateLimitKey);

    // Set TTL on first request in the window
    if (currentCount === 1) {
      await redis.expire(rateLimitKey, 60); // 1 minute window
    }

    if (currentCount > apiKey.rateLimit) {
      // Get TTL for Retry-After header
      const ttl = await redis.ttl(rateLimitKey);
      res.setHeader('Retry-After', ttl > 0 ? ttl : 60);
      res.setHeader('X-RateLimit-Limit', apiKey.rateLimit);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', Math.floor(Date.now() / 1000) + (ttl > 0 ? ttl : 60));
      next(new TooManyRequestsError('Rate limit exceeded'));
      return;
    }

    // Add rate limit headers to response
    res.setHeader('X-RateLimit-Limit', apiKey.rateLimit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, apiKey.rateLimit - currentCount));
    const resetTtl = await redis.ttl(rateLimitKey);
    res.setHeader('X-RateLimit-Reset', Math.floor(Date.now() / 1000) + (resetTtl > 0 ? resetTtl : 60));

    // Get client IP for audit logging
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

    // Record usage asynchronously (don't block response)
    apiKeyService.recordUsage(apiKey._id.toString(), clientIp).catch((err) => {
      log.error({ err }, 'Failed to record API key usage');
    });

    // Set request context for API key auth
    RequestContext.run(
      {
        userId: apiKey.createdBy.toString(),
        tenantId: apiKey.tenantId,
        email: '', // Not available via API key
        role: 'member', // API keys have member-level role by default
        requestId: randomUUID(),
        locale: (req as Request & { detectedLocale?: string }).detectedLocale ?? 'en',
        apiKeyId: apiKey._id.toString(),
        permissions: apiKey.permissions,
      },
      () => next()
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware factory that requires a specific API key permission.
 * Use after apiKeyAuthMiddleware or authMiddleware.
 *
 * For JWT-authenticated requests (no apiKeyId in context), all permissions are allowed.
 * For API key-authenticated requests, checks if the key has the required permission.
 *
 * @example
 * router.get('/tasks', requireApiPermission('tasks:read'), taskController.list);
 */
export function requireApiPermission(permission: ApiKeyPermission) {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    const ctx = RequestContext.getOptional();

    // No context means unauthenticated - should be caught by auth middleware
    if (!ctx) {
      next(new UnauthorizedError());
      return;
    }

    // JWT auth (no apiKeyId) - allow all permissions
    if (!ctx.apiKeyId) {
      next();
      return;
    }

    // API key auth - check permission
    if (!ctx.permissions?.includes(permission)) {
      next(new ForbiddenError(`API key lacks required permission: ${permission}`));
      return;
    }

    next();
  };
}
