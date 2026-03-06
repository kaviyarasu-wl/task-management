import { Request, Response, NextFunction } from 'express';
import { RequestContext } from '@core/context/RequestContext';
import { AuditLogService } from '@modules/audit/audit.service';
import { AuditEntityType } from '@modules/audit/audit.model';
import { config } from '../../config';

const auditService = new AuditLogService();

/**
 * Route path patterns to entity type mapping.
 * Used to extract entityType and entityId from the request path.
 */
const ROUTE_ENTITY_MAP: Array<{
  pattern: RegExp;
  entityType: AuditEntityType;
  entityIdGroup: number;
  actionPrefix: string;
}> = [
  { pattern: /\/api\/v1\/tasks\/([^/]+)/, entityType: 'task', entityIdGroup: 1, actionPrefix: 'task' },
  { pattern: /\/api\/v1\/tasks$/, entityType: 'task', entityIdGroup: 0, actionPrefix: 'task' },
  { pattern: /\/api\/v1\/projects\/([^/]+)/, entityType: 'project', entityIdGroup: 1, actionPrefix: 'project' },
  { pattern: /\/api\/v1\/projects$/, entityType: 'project', entityIdGroup: 0, actionPrefix: 'project' },
  { pattern: /\/api\/v1\/users\/([^/]+)/, entityType: 'user', entityIdGroup: 1, actionPrefix: 'user' },
  { pattern: /\/api\/v1\/roles\/([^/]+)/, entityType: 'role', entityIdGroup: 1, actionPrefix: 'role' },
  { pattern: /\/api\/v1\/roles$/, entityType: 'role', entityIdGroup: 0, actionPrefix: 'role' },
  { pattern: /\/api\/v1\/webhooks\/([^/]+)/, entityType: 'webhook', entityIdGroup: 1, actionPrefix: 'webhook' },
  { pattern: /\/api\/v1\/webhooks$/, entityType: 'webhook', entityIdGroup: 0, actionPrefix: 'webhook' },
  { pattern: /\/api\/v1\/api-keys\/([^/]+)/, entityType: 'apiKey', entityIdGroup: 1, actionPrefix: 'apiKey' },
  { pattern: /\/api\/v1\/api-keys$/, entityType: 'apiKey', entityIdGroup: 0, actionPrefix: 'apiKey' },
  { pattern: /\/api\/v1\/invitations\/([^/]+)/, entityType: 'invitation', entityIdGroup: 1, actionPrefix: 'invitation' },
  { pattern: /\/api\/v1\/invitations$/, entityType: 'invitation', entityIdGroup: 0, actionPrefix: 'invitation' },
  { pattern: /\/api\/v1\/status\/([^/]+)/, entityType: 'status', entityIdGroup: 1, actionPrefix: 'status' },
  { pattern: /\/api\/v1\/status$/, entityType: 'status', entityIdGroup: 0, actionPrefix: 'status' },
  { pattern: /\/api\/v1\/tenants\/([^/]+)/, entityType: 'tenant', entityIdGroup: 1, actionPrefix: 'tenant' },
];

const METHOD_ACTION_MAP: Record<string, string> = {
  POST: 'created',
  PATCH: 'updated',
  PUT: 'updated',
  DELETE: 'deleted',
};

const SENSITIVE_FIELDS = new Set([
  'password', 'passwordHash', 'secret', 'token',
  'accessToken', 'refreshToken', 'mfaCode', 'mfaSecret',
]);

/**
 * Audit middleware — logs all mutating HTTP requests.
 * Applied globally, but only logs POST/PATCH/PUT/DELETE requests.
 * Non-mutating requests (GET, OPTIONS, HEAD) are skipped.
 */
export function auditMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!config.AUDIT_LOG_ENABLED) {
    next();
    return;
  }

  // Only audit mutating methods
  const method = req.method.toUpperCase();
  if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
    next();
    return;
  }

  // Skip auth routes (login, register, refresh — these have their own logging)
  if (req.path.startsWith('/api/v1/auth')) {
    next();
    return;
  }

  // Skip audit-logs endpoint itself to avoid recursion
  if (req.path.startsWith('/api/v1/audit-logs')) {
    next();
    return;
  }

  // Capture response after it's sent
  const originalEnd = res.end.bind(res);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (res as any).end = function (...args: unknown[]) {
    const ctx = RequestContext.getOptional();
    if (ctx) {
      const entityInfo = extractEntityInfo(req.path, method);

      auditService.logAction({
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        userEmail: ctx.email,
        action: entityInfo.action,
        entityType: entityInfo.entityType,
        entityId: entityInfo.entityId,
        ipAddress: req.ip ?? req.socket.remoteAddress ?? 'unknown',
        userAgent: req.headers['user-agent'] ?? 'unknown',
        method,
        path: req.path,
        statusCode: res.statusCode,
        metadata: {
          body: sanitizeBody(req.body as Record<string, unknown>),
        },
      });
    }

    return (originalEnd as Function).apply(res, args);
  };

  next();
}

function extractEntityInfo(
  path: string,
  method: string
): { entityType: AuditEntityType; entityId: string; action: string } {
  const actionSuffix = METHOD_ACTION_MAP[method] ?? 'modified';

  for (const route of ROUTE_ENTITY_MAP) {
    const match = path.match(route.pattern);
    if (match) {
      const entityId = route.entityIdGroup > 0 ? (match[route.entityIdGroup] ?? 'unknown') : 'new';
      return {
        entityType: route.entityType,
        entityId,
        action: `${route.actionPrefix}.${actionSuffix}`,
      };
    }
  }

  return { entityType: 'settings', entityId: 'unknown', action: `unknown.${actionSuffix}` };
}

/**
 * Remove sensitive fields from request body before logging.
 */
function sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
  if (!body || typeof body !== 'object') return {};

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(body)) {
    if (SENSITIVE_FIELDS.has(key)) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
