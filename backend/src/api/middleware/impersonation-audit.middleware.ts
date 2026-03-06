import { Request, Response, NextFunction } from 'express';
import { RequestContext } from '@core/context/RequestContext';
import { ImpersonationService } from '@modules/admin/impersonation.service';
import { createLogger } from '@infrastructure/logger';

const log = createLogger('ImpersonationAudit');

const impersonationService = new ImpersonationService();

interface AuditRule {
  method: string;
  pathPattern: RegExp;
}

/**
 * Actions that should be logged during impersonation.
 * Only mutations (POST, PATCH, PUT, DELETE) on sensitive endpoints.
 */
const AUDITED_ACTIONS: AuditRule[] = [
  // Tasks
  { method: 'POST', pathPattern: /^\/api\/v1\/tasks/ },
  { method: 'PATCH', pathPattern: /^\/api\/v1\/tasks/ },
  { method: 'PUT', pathPattern: /^\/api\/v1\/tasks/ },
  { method: 'DELETE', pathPattern: /^\/api\/v1\/tasks/ },

  // Projects
  { method: 'POST', pathPattern: /^\/api\/v1\/projects/ },
  { method: 'PATCH', pathPattern: /^\/api\/v1\/projects/ },
  { method: 'PUT', pathPattern: /^\/api\/v1\/projects/ },
  { method: 'DELETE', pathPattern: /^\/api\/v1\/projects/ },

  // Users
  { method: 'POST', pathPattern: /^\/api\/v1\/users/ },
  { method: 'PATCH', pathPattern: /^\/api\/v1\/users/ },
  { method: 'DELETE', pathPattern: /^\/api\/v1\/users/ },

  // Tenant settings
  { method: 'PATCH', pathPattern: /^\/api\/v1\/tenant/ },
  { method: 'PUT', pathPattern: /^\/api\/v1\/tenant/ },

  // Invitations
  { method: 'POST', pathPattern: /^\/api\/v1\/invitations/ },
  { method: 'DELETE', pathPattern: /^\/api\/v1\/invitations/ },

  // API Keys
  { method: 'POST', pathPattern: /^\/api\/v1\/api-keys/ },
  { method: 'DELETE', pathPattern: /^\/api\/v1\/api-keys/ },
];

/**
 * Middleware to automatically log sensitive actions during impersonation sessions.
 *
 * This middleware captures mutation operations (POST, PATCH, PUT, DELETE) on
 * sensitive endpoints and logs them to the impersonation audit trail.
 *
 * Should be applied after impersonationContextMiddleware.
 */
export async function impersonationAuditMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const context = RequestContext.getOptional();

  // Only audit if we're in an impersonation session
  if (!context?.isImpersonating || !context.impersonationLogId) {
    return next();
  }

  // Check if this action should be audited
  const shouldAudit = AUDITED_ACTIONS.some(
    (rule) => req.method === rule.method && rule.pathPattern.test(req.path)
  );

  if (shouldAudit) {
    // Log the action asynchronously to not block the request
    impersonationService
      .logAction(context.impersonationLogId, `${req.method} ${req.path}`, {
        params: req.params,
        query: req.query,
        // Only log body keys, not values, for security
        bodyKeys: req.body ? Object.keys(req.body) : [],
      })
      .catch((err) => {
        // Log error but don't fail the request
        log.error({ err }, 'Failed to log impersonation action');
      });
  }

  next();
}

/**
 * Create a custom audit middleware with specific rules.
 * Use this when you need to audit additional endpoints.
 */
export function createImpersonationAuditMiddleware(rules: AuditRule[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const context = RequestContext.getOptional();

    if (!context?.isImpersonating || !context.impersonationLogId) {
      return next();
    }

    const shouldAudit = rules.some(
      (rule) => req.method === rule.method && rule.pathPattern.test(req.path)
    );

    if (shouldAudit) {
      impersonationService
        .logAction(context.impersonationLogId, `${req.method} ${req.path}`, {
          params: req.params,
          query: req.query,
          bodyKeys: req.body ? Object.keys(req.body) : [],
        })
        .catch((err) => {
          log.error({ err }, 'Failed to log impersonation action');
        });
    }

    next();
  };
}
