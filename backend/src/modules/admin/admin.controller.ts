import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service';
import {
  createPlanSchema,
  updatePlanSchema,
  tenantQuerySchema,
  userQuerySchema,
  updateTenantSchema,
  changeTenantPlanSchema,
  suspendTenantSchema,
  updateUserSchema,
  moveUserSchema,
} from './admin.validator';

const adminService = new AdminService();

export class AdminController {
  // ============ PLANS ============

  async listPlans(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plans = await adminService.listPlans();
      res.json({ success: true, data: plans });
    } catch (err) {
      next(err);
    }
  }

  async getPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plan = await adminService.getPlan(req.params.id);
      res.json({ success: true, data: plan });
    } catch (err) {
      next(err);
    }
  }

  async createPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createPlanSchema.parse(req.body);
      const plan = await adminService.createPlan(data);
      res.status(201).json({ success: true, data: plan });
    } catch (err) {
      next(err);
    }
  }

  async updatePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = updatePlanSchema.parse(req.body);
      const plan = await adminService.updatePlan(req.params.id, data);
      res.json({ success: true, data: plan });
    } catch (err) {
      next(err);
    }
  }

  async deletePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await adminService.deletePlan(req.params.id);
      res.json({ success: true, message: 'Plan deleted' });
    } catch (err) {
      next(err);
    }
  }

  async setDefaultPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plan = await adminService.setDefaultPlan(req.params.id);
      res.json({ success: true, data: plan });
    } catch (err) {
      next(err);
    }
  }

  // ============ TENANTS ============

  async listTenants(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = tenantQuerySchema.parse(req.query);
      const result = await adminService.listTenants(filters);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getTenant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminService.getTenant(req.params.id);
      res.json({ success: true, data: { ...result.tenant.toObject(), stats: result.stats } });
    } catch (err) {
      next(err);
    }
  }

  async updateTenant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = updateTenantSchema.parse(req.body);
      const tenant = await adminService.updateTenant(req.params.id, data);
      res.json({ success: true, data: tenant });
    } catch (err) {
      next(err);
    }
  }

  async changeTenantPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { planId } = changeTenantPlanSchema.parse(req.body);
      const tenant = await adminService.changeTenantPlan(req.params.id, planId);
      res.json({ success: true, data: tenant });
    } catch (err) {
      next(err);
    }
  }

  async suspendTenant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reason } = suspendTenantSchema.parse(req.body);
      const tenant = await adminService.suspendTenant(req.params.id, reason);
      res.json({ success: true, data: tenant });
    } catch (err) {
      next(err);
    }
  }

  async activateTenant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenant = await adminService.activateTenant(req.params.id);
      res.json({ success: true, data: tenant });
    } catch (err) {
      next(err);
    }
  }

  // ============ USERS ============

  async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = userQuerySchema.parse(req.query);
      const result = await adminService.listUsers(filters);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminService.getUser(req.params.id);
      res.json({
        success: true,
        data: {
          ...result.user.toObject(),
          tenant: result.tenant?.toObject(),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = updateUserSchema.parse(req.body);
      const user = await adminService.updateUser(req.params.id, data);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }

  async moveUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { targetTenantId, newRole } = moveUserSchema.parse(req.body);
      const user = await adminService.moveUserToTenant(
        req.params.id,
        targetTenantId,
        newRole
      );
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await adminService.deleteUserPermanently(req.params.id);
      res.json({ success: true, message: 'User deleted permanently' });
    } catch (err) {
      next(err);
    }
  }

  async resetUserPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tempPassword = await adminService.resetUserPassword(req.params.id);
      res.json({
        success: true,
        data: { tempPassword },
        message: 'Password reset. Share this temporary password with the user.',
      });
    } catch (err) {
      next(err);
    }
  }

  // ============ DASHBOARD ============

  async getDashboardStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await adminService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }
}
