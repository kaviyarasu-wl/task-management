import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { registerSchema, loginSchema } from '@api/validators/auth.validator';

const authService = new AuthService();

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const input = registerSchema.parse(req.body);
    const tokens = await authService.register(input);
    res.status(201).json({ success: true, data: tokens });
  },

  async login(req: Request, res: Response): Promise<void> {
    const input = loginSchema.parse(req.body);
    const tokens = await authService.login(input);
    res.json({ success: true, data: tokens });
  },

  async refresh(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body as { refreshToken: string };
    if (!refreshToken) {
      res.status(400).json({ success: false, message: 'refreshToken is required' });
      return;
    }
    const tokens = await authService.refresh(refreshToken);
    res.json({ success: true, data: tokens });
  },

  async logout(req: Request, res: Response): Promise<void> {
    // req.user is attached by auth middleware
    const userId = (req as Request & { user?: { userId: string } }).user?.userId;
    if (userId) await authService.logout(userId);
    res.json({ success: true, message: 'Logged out' });
  },

  async me(req: Request, res: Response): Promise<void> {
    res.json({ success: true, data: (req as Request & { user?: unknown }).user });
  },
};
