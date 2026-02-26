import { Router } from 'express';
import { userController } from '@modules/user/user.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { asyncWrapper } from '@core/utils/asyncWrapper';

const router = Router();

router.use(authMiddleware); // All user routes require auth

// ─── Own profile ─────────────────────────────────────────────────────────────
router.get('/me', asyncWrapper(userController.getMe));
router.patch('/me', asyncWrapper(userController.updateMe));
router.post('/me/change-password', asyncWrapper(userController.changePassword));

// ─── Tenant user management ──────────────────────────────────────────────────
router.get('/', asyncWrapper(userController.list));
router.get('/:id', asyncWrapper(userController.getById));
router.patch('/:id/role', requireRole(['owner', 'admin']), asyncWrapper(userController.updateRole));
router.delete('/:id', requireRole(['owner', 'admin']), asyncWrapper(userController.deactivate));

export { router as userRouter };
