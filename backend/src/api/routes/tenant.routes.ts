import { Router } from 'express';
import { tenantController } from '@modules/tenant/tenant.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { asyncWrapper } from '@core/utils/asyncWrapper';

const router = Router();

router.use(authMiddleware);

router.get('/me', asyncWrapper(tenantController.getMyOrg));
router.patch('/me/settings', requireRole(['owner', 'admin']), asyncWrapper(tenantController.updateSettings));
router.get('/me/members', asyncWrapper(tenantController.getMembers));
router.patch('/me/members/:userId/role', requireRole(['owner', 'admin']), asyncWrapper(tenantController.updateMemberRole));
router.delete('/me/members/:userId', requireRole(['owner', 'admin']), asyncWrapper(tenantController.removeMember));

export { router as tenantRouter };
