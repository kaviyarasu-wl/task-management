import { Router } from 'express';
import { authMiddleware } from '@api/middleware/auth.middleware';
import { asyncWrapper } from '@core/utils/asyncWrapper';
import { notificationController } from './notification.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', asyncWrapper(notificationController.list));
router.get('/unread-count', asyncWrapper(notificationController.unreadCount));
router.patch('/read-all', asyncWrapper(notificationController.markAllRead));
router.get('/preferences', asyncWrapper(notificationController.getPreferences));
router.patch('/preferences', asyncWrapper(notificationController.updatePreferences));
router.patch('/:id/read', asyncWrapper(notificationController.markRead));
router.delete('/:id', asyncWrapper(notificationController.remove));

export { router as notificationRouter };
