import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { JwtAccessPayload } from '@modules/auth/auth.types';
import { RequestContext } from '@core/context/RequestContext';
import { createLogger } from '@infrastructure/logger';

const log = createLogger('AuthMiddleware');
import { UnauthorizedError, ForbiddenError, TooManyRequestsError } from '@core/errors/AppError';
import { UserRole } from '../../types';
import { randomUUID } from 'crypto';
import { ApiKeyService } from '@modules/apiKey/apiKey.service';
import { ApiKeyPermission } from '@modules/apiKey/apiKey.model';
import { getRedisClient } from '@infrastructure/redis/client';

// Augment Express Request with locale detected by locale middleware
declare global {
  namespace Express {
    interface Request {
      detectedLocale?: string;
    }
  }
}

// Augment Express Request with user property
declare global {
  namespace Express {
    interface Request {
      user?: JwtAccessPayload;
    }
  }
}

const apiKeyService = new ApiKeyService();

/**
 * Unified authentication middleware that supports both JWT and API key auth.
 *
 * Authentication priority:
 * 1. X-API-Key header (API key authentication)
 * 2. Authorization: Bearer <token> header (JWT authentication)
 *
 * Sets RequestContext for the duration of the request.
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const apiKeyHeader = req.headers['x-api-key'] as string | undefined;

  // Try API key authentication first
  if (apiKeyHeader) {
    await authenticateWithApiKey(req, res, next, apiKeyHeader);
    return;
  }

  // Fall back to JWT authentication
  authenticateWithJwt(req, res, next);
}

/**
 * Authenticate using API key from X-API-Key header.
 */
async function authenticateWithApiKey(
  req: Request,
  res: Response,
  next: NextFunction,
  apiKeyHeader: string
): Promise<void> {
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
      const ttl = await redis.ttl(rateLimitKey);
      res.setHeader('Retry-After', ttl > 0 ? ttl : 60);
      res.setHeader('X-RateLimit-Limit', apiKey.rateLimit);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', Math.floor(Date.now() / 1000) + (ttl > 0 ? ttl : 60));
      next(new TooManyRequestsError('Rate limit exceeded'));
      return;
    }

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', apiKey.rateLimit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, apiKey.rateLimit - currentCount));
    const resetTtl = await redis.ttl(rateLimitKey);
    res.setHeader('X-RateLimit-Reset', Math.floor(Date.now() / 1000) + (resetTtl > 0 ? resetTtl : 60));

    // Record usage asynchronously
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    apiKeyService.recordUsage(apiKey._id.toString(), clientIp).catch((err) => {
      log.error({ err }, 'Failed to record API key usage');
    });

    // Set request context for API key auth
    RequestContext.run(
      {
        userId: apiKey.createdBy.toString(),
        tenantId: apiKey.tenantId,
        email: '',
        role: 'member',
        requestId: randomUUID(),
        locale: req.detectedLocale ?? config.DEFAULT_LOCALE,
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
 * Authenticate using JWT from Authorization header.
 */
function authenticateWithJwt(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next(new UnauthorizedError('Authorization header missing or malformed'));
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, config.JWT_ACCESS_SECRET) as JwtAccessPayload;
    req.user = payload;

    // Set AsyncLocalStorage context — available throughout this request's lifetime
    RequestContext.run(
      {
        userId: payload.userId,
        tenantId: payload.tenantId,
        email: payload.email,
        role: payload.role,
        rolePermissions: payload.rolePermissions,
        requestId: randomUUID(),
        locale: payload.locale ?? req.detectedLocale ?? config.DEFAULT_LOCALE,
      },
      () => next()
    );
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Token expired'));
    } else {
      next(new UnauthorizedError('Invalid token'));
    }
  }
}

/**
 * Role-based access control middleware factory.
 * Use after authMiddleware.
 *
 * For JWT auth: checks req.user.role
 * For API key auth: checks RequestContext role (always 'member')
 *
 * Example: router.delete('/tasks/:id', authMiddleware, requireRole(['owner', 'admin']), ...)
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    const ctx = RequestContext.getOptional();

    if (!ctx) {
      next(new UnauthorizedError());
      return;
    }

    if (!allowedRoles.includes(ctx.role)) {
      next(new ForbiddenError(`Requires one of: ${allowedRoles.join(', ')}`));
      return;
    }

    next();
  };
}

/**
 * Permission-based access control middleware for API key authentication.
 * Use after authMiddleware.
 *
 * For JWT-authenticated requests: always allows (full access)
 * For API key-authenticated requests: checks if key has the required permission
 *
 * Example: router.get('/tasks', requireApiPermission('tasks:read'), taskController.list)
 */
export function requireApiPermission(permission: ApiKeyPermission) {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    const ctx = RequestContext.getOptional();

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

/**
 * Permission-based access control middleware for role permissions.
 * Replaces requireRole() for granular access control.
 *
 * For JWT auth: checks user's role permissions (loaded from Role collection)
 * For API key auth: maps to API key permission format and checks
 *
 * Example: router.post('/tasks', requirePermission('tasks.create'), ...)
 */
export function requirePermission(permission: string) {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    const ctx = RequestContext.getOptional();
    if (!ctx) {
      next(new UnauthorizedError());
      return;
    }

    // API key auth — map resource.action to resource:read/write format
    if (ctx.apiKeyId) {
      const apiPerm = mapToApiKeyPermission(permission);
      if (!ctx.permissions?.includes(apiPerm as ApiKeyPermission)) {
        next(new ForbiddenError(`Missing permission: ${permission}`));
        return;
      }
      next();
      return;
    }

    // JWT auth — check role permissions from context
    if (ctx.rolePermissions) {
      if (
        ctx.rolePermissions.includes('*') ||
        ctx.rolePermissions.includes(permission) ||
        ctx.rolePermissions.includes(permission.split('.')[0] + '.*')
      ) {
        next();
        return;
      }
      next(new ForbiddenError(`Missing permission: ${permission}`));
      return;
    }

    // Fallback: allow owner/admin (backward compat before migration)
    if (ctx.role === 'owner' || ctx.role === 'admin') {
      next();
      return;
    }

    next(new ForbiddenError(`Missing permission: ${permission}`));
  };
}

function mapToApiKeyPermission(permission: string): string {
  const [resource, action] = permission.split('.');
  const readActions = ['read'];
  return `${resource}:${readActions.includes(action) ? 'read' : 'write'}`;
}
