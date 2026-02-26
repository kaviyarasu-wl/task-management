import { Router } from 'express';
import { userController } from '@modules/user/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { asyncWrapper } from '@core/utils/asyncWrapper';

const router = Router();

router.use(authMiddleware);

router.get('/me', asyncWrapper(userController.getMe));
router.patch('/me', asyncWrapper(userController.updateMe));
router.get('/', asyncWrapper(userController.list));
router.get('/:id', asyncWrapper(userController.getById));

export { router as userRouter };
