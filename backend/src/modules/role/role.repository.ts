import { Types } from 'mongoose';
import { Role, IRole } from './role.model';

export class RoleRepository {
  async findAll(tenantId: string): Promise<IRole[]> {
    return Role.find({ tenantId, deletedAt: null })
      .sort({ isSystem: -1, name: 1 })
      .exec();
  }

  async findById(tenantId: string, roleId: string): Promise<IRole | null> {
    return Role.findOne({ _id: roleId, tenantId, deletedAt: null }).exec();
  }

  async findBySlug(tenantId: string, slug: string): Promise<IRole | null> {
    return Role.findOne({ tenantId, slug, deletedAt: null }).exec();
  }

  async create(data: {
    tenantId: string;
    name: string;
    slug: string;
    description?: string;
    permissions: string[];
    isSystem: boolean;
    createdBy?: string;
  }): Promise<IRole> {
    const role = new Role({
      tenantId: data.tenantId,
      name: data.name,
      slug: data.slug,
      description: data.description,
      permissions: data.permissions,
      isSystem: data.isSystem,
      createdBy: data.createdBy ? new Types.ObjectId(data.createdBy) : undefined,
    });
    return role.save();
  }

  async update(
    tenantId: string,
    roleId: string,
    data: Partial<{ name: string; slug: string; description: string; permissions: string[] }>
  ): Promise<IRole | null> {
    return Role.findOneAndUpdate(
      { _id: roleId, tenantId, deletedAt: null },
      { $set: data },
      { new: true }
    ).exec();
  }

  async softDelete(tenantId: string, roleId: string): Promise<IRole | null> {
    return Role.findOneAndUpdate(
      { _id: roleId, tenantId, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    ).exec();
  }

  async createSystemRoles(
    tenantId: string,
    roles: Array<{
      name: string;
      slug: string;
      description: string;
      permissions: string[];
    }>
  ): Promise<IRole[]> {
    const docs = roles.map((r) => ({
      tenantId,
      name: r.name,
      slug: r.slug,
      description: r.description,
      permissions: r.permissions,
      isSystem: true,
    }));
    return Role.insertMany(docs);
  }
}
