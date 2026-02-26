import { Router } from 'express';
import { authController } from '@modules/auth/auth.controller';
import { authMiddleware } from '@api/middleware/auth.middleware';
import { asyncWrapper } from '@core/utils/asyncWrapper';

const router = Router();

router.post('/register', asyncWrapper(authController.register));
router.post('/login', asyncWrapper(authController.login));
router.post('/refresh', asyncWrapper(authController.refresh));
router.post('/logout', authMiddleware, asyncWrapper(authController.logout));
router.get('/me', authMiddleware, asyncWrapper(authController.me));

export { router as authRouter };
