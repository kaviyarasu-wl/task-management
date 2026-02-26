import { Request, Response } from 'express';
import { TenantService } from './tenant.service';
import { updateSettingsSchema, updateMemberRoleSchema } from '@api/validators/tenant.validator';

const tenantService = new TenantService();

export const tenantController = {
  async getMyOrg(req: Request, res: Response): Promise<void> {
    const org = await tenantService.getMyOrg();
    res.json({ success: true, data: org });
  },

  async updateSettings(req: Request, res: Response): Promise<void> {
    const input = updateSettingsSchema.parse(req.body);
    const org = await tenantService.updateSettings(input);
    res.json({ success: true, data: org });
  },

  async getMembers(req: Request, res: Response): Promise<void> {
    const members = await tenantService.getMembers();
    res.json({ success: true, data: members });
  },

  async updateMemberRole(req: Request, res: Response): Promise<void> {
    const { role } = updateMemberRoleSchema.parse(req.body);
    const updated = await tenantService.updateMemberRole(req.params['userId']!, role);
    res.json({ success: true, data: updated });
  },

  async removeMember(req: Request, res: Response): Promise<void> {
    await tenantService.removeMember(req.params['userId']!);
    res.json({ success: true, message: 'Member removed' });
  },
};
