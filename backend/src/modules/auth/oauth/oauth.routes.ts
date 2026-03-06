import { Router } from 'express';
import { authMiddleware } from '@api/middleware/auth.middleware';
import { asyncWrapper } from '@core/utils/asyncWrapper';
import { oauthController } from './oauth.controller';

const router = Router();

// Authenticated routes (must be before /:provider to avoid matching 'accounts')
router.get('/accounts', authMiddleware, asyncWrapper(oauthController.listLinkedAccounts));

// Public routes (no auth required)
router.get('/:provider', asyncWrapper(oauthController.redirect));
router.get('/:provider/callback', asyncWrapper(oauthController.callback));

// Authenticated routes
router.post('/:provider/link', authMiddleware, asyncWrapper(oauthController.linkAccount));
router.delete('/:provider/link', authMiddleware, asyncWrapper(oauthController.unlinkAccount));

export { router as oauthRouter };
