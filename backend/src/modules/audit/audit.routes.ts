import { Router } from 'express';
import { authMiddleware, requireRole } from '@api/middleware/auth.middleware';
import { asyncWrapper } from '@core/utils/asyncWrapper';
import { auditController } from './audit.controller';

const router = Router();

// All audit log routes require authentication + owner/admin role
router.use(authMiddleware);
router.use(requireRole(['owner', 'admin']));

router.get('/', asyncWrapper(auditController.list));
router.get('/export', asyncWrapper(auditController.exportCsv));
router.get('/stats', asyncWrapper(auditController.stats));
router.get('/:id', asyncWrapper(auditController.getById));

export { router as auditRouter };
