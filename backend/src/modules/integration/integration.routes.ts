import { Router } from 'express';
import { authMiddleware, requireRole } from '@api/middleware/auth.middleware';
import { asyncWrapper } from '@core/utils/asyncWrapper';
import { integrationController } from './integration.controller';

const router = Router();

// ── Unauthenticated routes ──────────────────────────────────
// Inbound webhook from external services (verified by HMAC signature)
router.post('/:provider/webhook', asyncWrapper(integrationController.handleInboundWebhook));

// ── Authenticated routes (all users) ────────────────────────
router.use(authMiddleware);

// Static provider catalog
router.get('/providers', asyncWrapper(integrationController.listProviders));

// Tenant's active connections
router.get('/connections', asyncWrapper(integrationController.listConnections));

// Connection event log
router.get(
  '/connections/:connectionId/events',
  asyncWrapper(integrationController.getConnectionEvents)
);

// ── Admin/Owner routes ──────────────────────────────────────
// Initiate connection (may return OAuth redirect URL or direct connection)
router.post(
  '/:providerId/connect',
  requireRole(['admin', 'owner']),
  asyncWrapper(integrationController.connectProvider)
);

// Complete OAuth callback (POST with code + state body)
router.post(
  '/:providerId/callback',
  requireRole(['admin', 'owner']),
  asyncWrapper(integrationController.completeOAuth)
);

// Update connection config
router.patch(
  '/connections/:connectionId',
  requireRole(['admin', 'owner']),
  asyncWrapper(integrationController.updateConnectionConfig)
);

// Test connection health
router.post(
  '/connections/:connectionId/test',
  requireRole(['admin', 'owner']),
  asyncWrapper(integrationController.testConnectionHealth)
);

// Disconnect (soft delete)
router.delete(
  '/connections/:connectionId',
  requireRole(['admin', 'owner']),
  asyncWrapper(integrationController.disconnectConnection)
);

// ── Legacy routes (backward compatibility) ──────────────────
router.get('/', asyncWrapper(integrationController.list));
router.patch('/:id/config', requireRole(['admin', 'owner']), asyncWrapper(integrationController.updateConfig));
router.post('/:id/test', requireRole(['admin', 'owner']), asyncWrapper(integrationController.testConnection));
router.delete('/:id', requireRole(['admin', 'owner']), asyncWrapper(integrationController.disconnect));

export { router as integrationRouter };
