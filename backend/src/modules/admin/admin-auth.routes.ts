import { Router } from 'express';
import { AdminAuthController } from './admin-auth.controller';
import { superAdminAuth, adminRateLimit } from '@api/middleware/superadmin.middleware';
import { asyncWrapper } from '@core/utils/asyncWrapper';

const router = Router();
const controller = new AdminAuthController();

// Apply rate limiting to all auth routes
router.use(adminRateLimit(20, 60000)); // 20 requests per minute for auth endpoints

// Public routes
router.post('/login', asyncWrapper(controller.login.bind(controller)));
router.post('/refresh', asyncWrapper(controller.refresh.bind(controller)));

// Protected routes
router.post('/logout', superAdminAuth, controller.logout.bind(controller));
router.get('/me', superAdminAuth, asyncWrapper(controller.me.bind(controller)));

export const adminAuthRoutes = router;
