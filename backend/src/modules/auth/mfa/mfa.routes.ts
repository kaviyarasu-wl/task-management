import { Router } from 'express';
import { authMiddleware } from '@api/middleware/auth.middleware';
import { asyncWrapper } from '@core/utils/asyncWrapper';
import { mfaController } from './mfa.controller';

const router = Router();

// Public routes (use mfaToken instead of JWT)
router.post('/verify', asyncWrapper(mfaController.verifyLogin));
router.post('/recovery', asyncWrapper(mfaController.recovery));

// Authenticated routes
router.post('/setup', authMiddleware, asyncWrapper(mfaController.setup));
router.post('/verify-setup', authMiddleware, asyncWrapper(mfaController.verifySetup));
router.post('/disable', authMiddleware, asyncWrapper(mfaController.disable));

export { router as mfaRouter };
