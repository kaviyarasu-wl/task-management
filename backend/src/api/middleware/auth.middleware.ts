import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { JwtAccessPayload } from '@modules/auth/auth.types';
import { RequestContext } from '@core/context/RequestContext';
import { UnauthorizedError, ForbiddenError } from '@core/errors/AppError';
import { UserRole } from '../../types';
import { randomUUID } from 'crypto';

// Augment Express Request with user property
declare global {
  namespace Express {
    interface Request {
      user?: JwtAccessPayload;
    }
  }
}

/**
 * Verifies JWT, attaches user to req.user, and sets RequestContext
 * for the duration of this request.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
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
        requestId: randomUUID(),
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
 * Example: router.delete('/tasks/:id', authMiddleware, requireRole(['owner', 'admin']), ...)
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new ForbiddenError(`Requires one of: ${allowedRoles.join(', ')}`));
      return;
    }

    next();
  };
}
