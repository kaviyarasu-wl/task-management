import { Router } from 'express';
import { authMiddleware, requireRole } from '@api/middleware/auth.middleware';
import { asyncWrapper } from '@core/utils/asyncWrapper';
import { statusController } from '@modules/status/status.controller';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// ============================================================
// Read routes - any authenticated user
// ============================================================

// GET /api/v1/status - List all statuses
router.get('/', asyncWrapper(statusController.list));

// GET /api/v1/status/default - Get default status for new tasks
router.get('/default', asyncWrapper(statusController.getDefault));

// GET /api/v1/status/matrix - Get full transition matrix
router.get('/matrix', asyncWrapper(statusController.getTransitionMatrix));

// GET /api/v1/status/:id - Get single status
router.get('/:id', asyncWrapper(statusController.getById));

// GET /api/v1/status/:id/transitions - Get available transitions from a status
router.get('/:id/transitions', asyncWrapper(statusController.getAvailableTransitions));

// ============================================================
// Write routes - admin or owner only
// ============================================================

// POST /api/v1/status - Create new status
router.post(
  '/',
  requireRole(['admin', 'owner']),
  asyncWrapper(statusController.create)
);

// PATCH /api/v1/status/:id - Update status
router.patch(
  '/:id',
  requireRole(['admin', 'owner']),
  asyncWrapper(statusController.update)
);

// DELETE /api/v1/status/:id - Delete status
router.delete(
  '/:id',
  requireRole(['admin', 'owner']),
  asyncWrapper(statusController.delete)
);

// PUT /api/v1/status/reorder - Reorder statuses
router.put(
  '/reorder',
  requireRole(['admin', 'owner']),
  asyncWrapper(statusController.reorder)
);

// PATCH /api/v1/status/:id/default - Set status as default
router.patch(
  '/:id/default',
  requireRole(['admin', 'owner']),
  asyncWrapper(statusController.setDefault)
);

// PUT /api/v1/status/:id/transitions - Update allowed transitions
router.put(
  '/:id/transitions',
  requireRole(['admin', 'owner']),
  asyncWrapper(statusController.updateTransitions)
);

export const statusRouter = router;
