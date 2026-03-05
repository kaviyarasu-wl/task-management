import { Request, Response, NextFunction } from 'express';
import { SuperAdminAuthService } from './superadmin-auth.service';
import { superAdminLoginSchema, superAdminRefreshSchema } from './admin.validator';

const authService = new SuperAdminAuthService();

export class AdminAuthController {
  /**
   * POST /api/v1/admin/auth/login
   * Authenticate superadmin and return tokens
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, mfaCode } = superAdminLoginSchema.parse(req.body);

      const result = await authService.login(email, password, mfaCode);

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/admin/auth/refresh
   * Refresh access token using refresh token
   */
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = superAdminRefreshSchema.parse(req.body);

      const result = await authService.refresh(refreshToken);

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/admin/auth/logout
   * Logout superadmin (invalidate tokens)
   */
  logout(_req: Request, res: Response, _next: NextFunction): void {
    // In a more complete implementation, you would:
    // 1. Add refresh token to a blacklist in Redis
    // 2. Clear any server-side sessions

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  }

  /**
   * GET /api/v1/admin/auth/me
   * Get current superadmin profile
   */
  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const admin = await authService.getProfile(req.superAdmin!.superAdminId);

      res.json({
        success: true,
        data: admin,
      });
    } catch (err) {
      next(err);
    }
  }
}
