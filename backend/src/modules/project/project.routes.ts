import { Router } from 'express';
import { projectController } from '@modules/project/project.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { asyncWrapper } from '@core/utils/asyncWrapper';

const router = Router();

router.use(authMiddleware);

router.get('/', asyncWrapper(projectController.list));
router.get('/:id', asyncWrapper(projectController.getById));
router.post('/', asyncWrapper(projectController.create));
router.patch('/:id', asyncWrapper(projectController.update));
router.delete(
  '/:id',
  requireRole(['owner', 'admin']),
  asyncWrapper(projectController.delete)
);

export { router as projectRouter };
