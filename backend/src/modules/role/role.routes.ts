import { Router } from 'express';
import { authMiddleware, requirePermission } from '@api/middleware/auth.middleware';
import { asyncWrapper } from '@core/utils/asyncWrapper';
import { roleController } from './role.controller';

const router = Router();

router.use(authMiddleware);

// Read operations — any authenticated user can list roles/permissions
router.get('/', asyncWrapper(roleController.list));
router.get('/permissions', asyncWrapper(roleController.listPermissions));

// Write operations — require roles.manage permission
router.post('/', requirePermission('roles.manage'), asyncWrapper(roleController.create));
router.patch('/:id', requirePermission('roles.manage'), asyncWrapper(roleController.update));
router.delete('/:id', requirePermission('roles.manage'), asyncWrapper(roleController.remove));

export { router as roleRouter };
