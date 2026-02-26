import { Request, Response } from 'express';
import { z } from 'zod';
import { UserService } from './user.service';

const userService = new UserService();

// ─── Validators (inline — simple enough not to need a separate file) ──────────

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName:  z.string().min(1).max(50).optional(),
}).refine((d) => d.firstName !== undefined || d.lastName !== undefined, {
  message: 'Provide at least one field to update',
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
});

const updateRoleSchema = z.object({
  role: z.enum(['admin', 'member', 'viewer']),
});

const listQuerySchema = z.object({
  role: z.enum(['owner', 'admin', 'member', 'viewer']).optional(),
});

// ─── Controller ───────────────────────────────────────────────────────────────

export const userController = {
  /**
   * GET /users/me
   * Returns the currently authenticated user's full profile.
   */
  async getMe(_req: Request, res: Response): Promise<void> {
    const user = await userService.getMyProfile();
    res.json({ success: true, data: user });
  },

  /**
   * PATCH /users/me
   * Update own first/last name.
   */
  async updateMe(req: Request, res: Response): Promise<void> {
    const input = updateProfileSchema.parse(req.body);
    const user = await userService.updateMyProfile(input);
    res.json({ success: true, data: user });
  },

  /**
   * POST /users/me/change-password
   * Change own password. Invalidates all active refresh tokens on success.
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    const input = changePasswordSchema.parse(req.body);
    await userService.changeMyPassword(input);
    res.json({
      success: true,
      message: 'Password updated. Please log in again on all devices.',
    });
  },

  /**
   * GET /users
   * List all users in the current tenant.
   * Supports optional ?role= filter.
   */
  async list(req: Request, res: Response): Promise<void> {
    const { role } = listQuerySchema.parse(req.query);
    const users = await userService.listByTenant({ role });
    res.json({ success: true, data: users, total: users.length });
  },

  /**
   * GET /users/:id
   * Get any user in the same tenant by ID.
   */
  async getById(req: Request, res: Response): Promise<void> {
    const user = await userService.getProfile(req.params['id']!);
    res.json({ success: true, data: user });
  },

  /**
   * PATCH /users/:id/role
   * Change a user's role. Restricted to owner/admin.
   * Cannot assign 'owner' role — ownership transfer is a separate flow.
   */
  async updateRole(req: Request, res: Response): Promise<void> {
    const { role } = updateRoleSchema.parse(req.body);
    const user = await userService.updateRole(req.params['id']!, role);
    res.json({ success: true, data: user });
  },

  /**
   * DELETE /users/:id
   * Soft-deactivate a user. Restricted to owner/admin.
   * Cannot deactivate yourself or the org owner.
   * Immediately invalidates the user's refresh token.
   */
  async deactivate(req: Request, res: Response): Promise<void> {
    await userService.deactivate(req.params['id']!);
    res.json({ success: true, message: 'User deactivated' });
  },
};
