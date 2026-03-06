import { RoleRepository } from './role.repository';
import { RequestContext } from '@core/context/RequestContext';
import { Role, IRole } from './role.model';
import { User } from '@modules/user/user.model';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '@core/errors/AppError';
import { EventBus } from '@core/events/EventBus';
import { ALL_PERMISSIONS, PERMISSION_GROUPS, PERMISSIONS, SYSTEM_ROLES, Permission } from './permissions';

export class RoleService {
  private repo: RoleRepository;

  constructor() {
    this.repo = new RoleRepository();
  }

  async listRoles(): Promise<IRole[]> {
    const { tenantId } = RequestContext.get();
    return this.repo.findAll(tenantId);
  }

  async createRole(data: {
    name: string;
    description?: string;
    permissions: string[];
  }): Promise<IRole> {
    const { tenantId, userId } = RequestContext.get();

    // Validate all permissions are valid
    const invalidPerms = data.permissions.filter(
      (p) => !ALL_PERMISSIONS.includes(p as Permission) && p !== '*'
    );
    if (invalidPerms.length > 0) {
      throw new BadRequestError(`Invalid permissions: ${invalidPerms.join(', ')}`);
    }

    // Generate slug from name
    const slug = data.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    // Check uniqueness
    const existing = await this.repo.findBySlug(tenantId, slug);
    if (existing) {
      throw new ConflictError(`Role with slug "${slug}" already exists`);
    }

    const role = await this.repo.create({
      tenantId,
      name: data.name,
      slug,
      description: data.description,
      permissions: data.permissions,
      isSystem: false,
      createdBy: userId,
    });

    await EventBus.emit('role.created', {
      roleId: role._id!.toString(),
      tenantId,
      createdBy: userId,
    });

    return role;
  }

  async updateRole(
    roleId: string,
    data: { name?: string; description?: string; permissions?: string[] }
  ): Promise<IRole> {
    const { tenantId } = RequestContext.get();

    const role = await this.repo.findById(tenantId, roleId);
    if (!role) throw new NotFoundError('Role');
    if (role.isSystem) throw new ForbiddenError('System roles cannot be modified');

    // Validate permissions if provided
    if (data.permissions) {
      const invalidPerms = data.permissions.filter(
        (p) => !ALL_PERMISSIONS.includes(p as Permission) && p !== '*'
      );
      if (invalidPerms.length > 0) {
        throw new BadRequestError(`Invalid permissions: ${invalidPerms.join(', ')}`);
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.name) {
      updateData.name = data.name;
      updateData.slug = data.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    }
    if (data.description !== undefined) updateData.description = data.description;
    if (data.permissions) updateData.permissions = data.permissions;

    const updated = await this.repo.update(tenantId, roleId, updateData);
    if (!updated) throw new NotFoundError('Role');

    await EventBus.emit('role.updated', {
      roleId,
      tenantId,
    });

    return updated;
  }

  async deleteRole(roleId: string): Promise<void> {
    const { tenantId } = RequestContext.get();

    const role = await this.repo.findById(tenantId, roleId);
    if (!role) throw new NotFoundError('Role');
    if (role.isSystem) throw new ForbiddenError('System roles cannot be deleted');

    // Check if any users have this role
    const usersWithRole = await User.countDocuments({
      tenantId,
      roleId: role._id,
      deletedAt: null,
    });
    if (usersWithRole > 0) {
      throw new BadRequestError(
        `Cannot delete role: ${usersWithRole} user(s) are assigned to it. Reassign them first.`
      );
    }

    await this.repo.softDelete(tenantId, roleId);

    await EventBus.emit('role.deleted', {
      roleId,
      tenantId,
    });
  }

  async listPermissions(): Promise<
    Array<{
      id: string;
      name: string;
      description: string;
      permissions: Array<{
        id: string;
        name: string;
        description: string;
        category: string;
      }>;
    }>
  > {
    return PERMISSION_GROUPS.map((group) => ({
      id: group.name.toLowerCase().replace(/\s+/g, '-'),
      name: group.name,
      description: `Manage ${group.name.toLowerCase()} permissions`,
      permissions: group.permissions.map((key) => ({
        id: key,
        name: PERMISSIONS[key as keyof typeof PERMISSIONS] ?? key,
        description: key,
        category: group.name,
      })),
    }));
  }

  /**
   * Seed system roles for a new tenant.
   */
  async seedSystemRoles(tenantId: string): Promise<void> {
    const roles = Object.values(SYSTEM_ROLES).map((r) => ({
      name: r.name,
      slug: r.slug,
      description: r.description,
      permissions: r.permissions,
    }));
    await this.repo.createSystemRoles(tenantId, roles);
  }

  /**
   * Check if a role has a specific permission.
   * Used by requirePermission() middleware.
   */
  static async hasPermission(
    tenantId: string,
    roleId: string,
    permission: string
  ): Promise<boolean> {
    const role = await Role.findOne({ _id: roleId, tenantId, deletedAt: null }).lean();
    if (!role) return false;

    // Wildcard check
    if (role.permissions.includes('*')) return true;

    // Exact match
    if (role.permissions.includes(permission)) return true;

    // Resource wildcard: 'tasks.*' grants 'tasks.create'
    const [resource] = permission.split('.');
    if (role.permissions.includes(`${resource}.*`)) return true;

    return false;
  }
}
