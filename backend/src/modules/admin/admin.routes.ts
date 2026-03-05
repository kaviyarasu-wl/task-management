import { Router } from 'express';
import { AdminController } from './admin.controller';
import { ImpersonationController } from './impersonation.controller';
import { superAdminAuth } from '@api/middleware/superadmin.middleware';
import { adminAuthRoutes } from './admin-auth.routes';
import { asyncWrapper } from '@core/utils/asyncWrapper';

const router = Router();
const controller = new AdminController();
const impersonationController = new ImpersonationController();

// Auth routes (some public)
router.use('/auth', adminAuthRoutes);

// All routes below require superadmin auth
router.use(superAdminAuth);

// Dashboard
router.get('/dashboard/stats', asyncWrapper(controller.getDashboardStats.bind(controller)));

// Plans
router.get('/plans', asyncWrapper(controller.listPlans.bind(controller)));
router.post('/plans', asyncWrapper(controller.createPlan.bind(controller)));
router.get('/plans/:id', asyncWrapper(controller.getPlan.bind(controller)));
router.patch('/plans/:id', asyncWrapper(controller.updatePlan.bind(controller)));
router.delete('/plans/:id', asyncWrapper(controller.deletePlan.bind(controller)));
router.post('/plans/:id/set-default', asyncWrapper(controller.setDefaultPlan.bind(controller)));

// Tenants
router.get('/tenants', asyncWrapper(controller.listTenants.bind(controller)));
router.get('/tenants/:id', asyncWrapper(controller.getTenant.bind(controller)));
router.patch('/tenants/:id', asyncWrapper(controller.updateTenant.bind(controller)));
router.post('/tenants/:id/change-plan', asyncWrapper(controller.changeTenantPlan.bind(controller)));
router.post('/tenants/:id/suspend', asyncWrapper(controller.suspendTenant.bind(controller)));
router.post('/tenants/:id/activate', asyncWrapper(controller.activateTenant.bind(controller)));

// Users
router.get('/users', asyncWrapper(controller.listUsers.bind(controller)));
router.get('/users/:id', asyncWrapper(controller.getUser.bind(controller)));
router.patch('/users/:id', asyncWrapper(controller.updateUser.bind(controller)));
router.post('/users/:id/move', asyncWrapper(controller.moveUser.bind(controller)));
router.delete('/users/:id', asyncWrapper(controller.deleteUser.bind(controller)));
router.post('/users/:id/reset-password', asyncWrapper(controller.resetUserPassword.bind(controller)));

// Impersonation
// Note: /impersonate/stop must be before /impersonate/:tenantId to avoid route conflict
router.get('/impersonate/status', asyncWrapper(impersonationController.status.bind(impersonationController)));
router.post('/impersonate/stop', asyncWrapper(impersonationController.stop.bind(impersonationController)));
router.post('/impersonate/:tenantId', asyncWrapper(impersonationController.start.bind(impersonationController)));
router.get('/impersonation-logs', asyncWrapper(impersonationController.getLogs.bind(impersonationController)));

export const adminRoutes = router;
