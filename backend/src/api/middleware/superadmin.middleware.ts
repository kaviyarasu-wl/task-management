import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { UnauthorizedError, ForbiddenError } from '@core/errors/AppError';
import { randomUUID } from 'crypto';

// Use separate secret for admin tokens (fallback to main secret + suffix)
const ADMIN_JWT_SECRET: jwt.Secret = config.JWT_ADMIN_SECRET ?? `${config.JWT_ACCESS_SECRET}_admin`;
const ADMIN_TOKEN_EXPIRY: string = config.JWT_ADMIN_EXPIRES_IN;

export interface SuperAdminJwtPayload {
  superAdminId: string;
  email: string;
  role: 'superadmin';
  impersonatingTenantId?: string;
  impersonatingUserId?: string;
  impersonationLogId?: string;
}

export interface SuperAdminRefreshPayload {
  superAdminId: string;
  type: 'admin_refresh';
}

export interface SuperAdminContext {
  superAdminId: string;
  email: string;
  role: 'superadmin';
  requestId: string;
  impersonatingTenantId?: string;
  impersonatingUserId?: string;
  impersonationLogId?: string;
}

// Extend Express Request
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      superAdmin?: SuperAdminContext;
    }
  }
}

/**
 * Generate admin JWT access token
 */
export function generateAdminToken(payload: Omit<SuperAdminJwtPayload, 'role'>): string {
  return jwt.sign({ ...payload, role: 'superadmin' }, ADMIN_JWT_SECRET, {
    expiresIn: ADMIN_TOKEN_EXPIRY,
  } as jwt.SignOptions);
}

/**
 * Generate admin refresh token (longer expiry)
 */
export function generateAdminRefreshToken(superAdminId: string): string {
  return jwt.sign(
    { superAdminId, type: 'admin_refresh' } as SuperAdminRefreshPayload,
    ADMIN_JWT_SECRET,
    { expiresIn: '7d' } as jwt.SignOptions
  );
}

/**
 * Verify admin access token
 */
export function verifyAdminToken(token: string): SuperAdminJwtPayload {
  return jwt.verify(token, ADMIN_JWT_SECRET) as SuperAdminJwtPayload;
}

/**
 * Verify admin refresh token
 */
export function verifyAdminRefreshToken(token: string): SuperAdminRefreshPayload {
  const payload = jwt.verify(token, ADMIN_JWT_SECRET) as SuperAdminRefreshPayload;

  if (payload.type !== 'admin_refresh') {
    throw new Error('Invalid token type');
  }

  return payload;
}

/**
 * Authenticate superadmin requests
 */
export function superAdminAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Admin authorization required'));
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAdminToken(token);

    if (payload.role !== 'superadmin') {
      return next(new ForbiddenError('Superadmin access required'));
    }

    req.superAdmin = {
      superAdminId: payload.superAdminId,
      email: payload.email,
      role: 'superadmin',
      requestId: randomUUID(),
      impersonatingTenantId: payload.impersonatingTenantId,
      impersonatingUserId: payload.impersonatingUserId,
      impersonationLogId: payload.impersonationLogId,
    };

    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Admin token expired'));
    } else if (err instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid admin token'));
    } else {
      next(err);
    }
  }
}

/**
 * In-memory rate limiting for admin endpoints.
 * For production, consider using Redis-based rate limiting.
 */
export function adminRateLimit(maxRequests: number = 100, windowMs: number = 60000) {
  const requests = new Map<string, { count: number; resetAt: number }>();

  // Clean up expired entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of requests.entries()) {
      if (record.resetAt < now) {
        requests.delete(key);
      }
    }
  }, windowMs);

  return (req: Request, _res: Response, next: NextFunction) => {
    const key = req.superAdmin?.superAdminId ?? req.ip ?? 'unknown';
    const now = Date.now();

    let record = requests.get(key);

    if (!record || record.resetAt < now) {
      record = { count: 0, resetAt: now + windowMs };
      requests.set(key, record);
    }

    record.count++;

    if (record.count > maxRequests) {
      return next(new ForbiddenError('Rate limit exceeded'));
    }

    next();
  };
}
