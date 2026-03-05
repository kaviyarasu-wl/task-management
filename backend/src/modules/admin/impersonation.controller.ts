import { Request, Response } from 'express';
import { ImpersonationService } from './impersonation.service';
import { z } from 'zod';

const impersonationService = new ImpersonationService();

const startImpersonationSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason must be 500 characters or less'),
});

const logsQuerySchema = z.object({
  superAdminId: z.string().optional(),
  tenantId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export class ImpersonationController {
  /**
   * POST /api/v1/admin/impersonate/:tenantId
   * Start impersonating a tenant
   */
  async start(req: Request, res: Response): Promise<void> {
    const { reason } = startImpersonationSchema.parse(req.body);

    const result = await impersonationService.startImpersonation(
      req.superAdmin!.superAdminId,
      req.params.tenantId,
      reason,
      {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      }
    );

    res.json({
      success: true,
      data: result,
      message: `Now impersonating ${result.tenant.name}`,
    });
  }

  /**
   * POST /api/v1/admin/impersonate/stop
   * Stop current impersonation session
   */
  async stop(req: Request, res: Response): Promise<void> {
    const result = await impersonationService.stopImpersonation(
      req.superAdmin!.superAdminId
    );

    res.json({
      success: true,
      data: result,
      message: 'Impersonation session ended',
    });
  }

  /**
   * GET /api/v1/admin/impersonate/status
   * Get current impersonation status
   */
  async status(req: Request, res: Response): Promise<void> {
    const session = await impersonationService.getActiveSession(
      req.superAdmin!.superAdminId
    );

    res.json({
      success: true,
      data: {
        isImpersonating: !!session,
        session,
      },
    });
  }

  /**
   * GET /api/v1/admin/impersonation-logs
   * Get impersonation audit logs
   */
  async getLogs(req: Request, res: Response): Promise<void> {
    const filters = logsQuerySchema.parse(req.query);
    const result = await impersonationService.getLogs(filters);

    res.json({
      success: true,
      ...result,
    });
  }
}
