import { Request, Response } from 'express';
import { NotificationService } from './notification.service';
import {
  notificationQuerySchema,
  notificationIdParamSchema,
  updatePreferencesSchema,
} from '@api/validators/notification.validator';

const notificationService = new NotificationService();

export const notificationController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = notificationQuerySchema.parse(req.query);
    const result = await notificationService.listNotifications(query);
    res.json({ success: true, ...result });
  },

  async unreadCount(_req: Request, res: Response): Promise<void> {
    const count = await notificationService.getUnreadCount();
    res.json({ success: true, data: { count } });
  },

  async markRead(req: Request, res: Response): Promise<void> {
    const { id } = notificationIdParamSchema.parse(req.params);
    const notification = await notificationService.markAsRead(id);
    res.json({ success: true, data: notification });
  },

  async markAllRead(_req: Request, res: Response): Promise<void> {
    const modifiedCount = await notificationService.markAllAsRead();
    res.json({ success: true, data: { modifiedCount } });
  },

  async remove(req: Request, res: Response): Promise<void> {
    const { id } = notificationIdParamSchema.parse(req.params);
    await notificationService.deleteNotification(id);
    res.json({ success: true, data: { message: 'Notification deleted' } });
  },

  async getPreferences(_req: Request, res: Response): Promise<void> {
    const prefs = await notificationService.getPreferences();
    res.json({ success: true, data: prefs });
  },

  async updatePreferences(req: Request, res: Response): Promise<void> {
    const body = updatePreferencesSchema.parse(req.body);
    const prefs = await notificationService.updatePreferences(body);
    res.json({ success: true, data: prefs });
  },
};
