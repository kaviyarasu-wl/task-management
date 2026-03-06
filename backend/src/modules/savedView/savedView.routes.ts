import { Router } from 'express';
import { authMiddleware } from '@api/middleware/auth.middleware';
import { asyncWrapper } from '@core/utils/asyncWrapper';
import { savedViewController } from './savedView.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', asyncWrapper(savedViewController.list));
router.post('/', asyncWrapper(savedViewController.create));
router.patch('/:id', asyncWrapper(savedViewController.update));
router.delete('/:id', asyncWrapper(savedViewController.delete));
router.patch('/:id/default', asyncWrapper(savedViewController.setDefault));

export { router as savedViewRouter };
