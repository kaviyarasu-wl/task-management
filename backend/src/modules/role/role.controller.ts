import { Request, Response } from 'express';
import { RoleService } from './role.service';
import {
  roleIdParamSchema,
  createRoleSchema,
  updateRoleSchema,
} from '@api/validators/role.validator';

const roleService = new RoleService();

export const roleController = {
  async list(_req: Request, res: Response): Promise<void> {
    const roles = await roleService.listRoles();
    res.json({ success: true, data: roles });
  },

  async create(req: Request, res: Response): Promise<void> {
    const body = createRoleSchema.parse(req.body);
    const role = await roleService.createRole(body);
    res.status(201).json({ success: true, data: role });
  },

  async update(req: Request, res: Response): Promise<void> {
    const { id } = roleIdParamSchema.parse(req.params);
    const body = updateRoleSchema.parse(req.body);
    const role = await roleService.updateRole(id, body);
    res.json({ success: true, data: role });
  },

  async remove(req: Request, res: Response): Promise<void> {
    const { id } = roleIdParamSchema.parse(req.params);
    await roleService.deleteRole(id);
    res.json({ success: true, data: { message: 'Role deleted' } });
  },

  async listPermissions(_req: Request, res: Response): Promise<void> {
    const permissions = await roleService.listPermissions();
    res.json({ success: true, data: permissions });
  },
};
