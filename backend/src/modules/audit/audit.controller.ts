import { Request, Response } from 'express';
import { AuditLogService } from './audit.service';
import {
  auditIdParamSchema,
  auditQuerySchema,
  auditExportQuerySchema,
} from '@api/validators/audit.validator';

const auditService = new AuditLogService();

export const auditController = {
  async list(req: Request, res: Response): Promise<void> {
    const filters = auditQuerySchema.parse(req.query);
    const result = await auditService.list(filters);
    res.json({ success: true, ...result });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = auditIdParamSchema.parse(req.params);
    const entry = await auditService.getById(id);
    res.json({ success: true, data: entry });
  },

  async exportCsv(req: Request, res: Response): Promise<void> {
    const filters = auditExportQuerySchema.parse(req.query);
    const csv = await auditService.exportCsv(filters);

    const filename = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  },

  async stats(_req: Request, res: Response): Promise<void> {
    const stats = await auditService.getStats();
    res.json({ success: true, data: stats });
  },
};
