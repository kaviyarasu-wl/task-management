import { Tenant, ITenant } from './tenant.model';
import { User, IUser } from '../user/user.model';
import { UserRole } from '../../types';

export class TenantRepository {
  async findById(tenantId: string): Promise<ITenant | null> {
    return Tenant.findOne({ tenantId }).exec();
  }

  async findBySlug(slug: string): Promise<ITenant | null> {
    return Tenant.findOne({ slug, isActive: true }).exec();
  }

  async updateSettings(tenantId: string, settings: Partial<ITenant['settings']>): Promise<ITenant | null> {
    return Tenant.findOneAndUpdate(
      { tenantId },
      { $set: { settings } },
      { new: true }
    ).exec();
  }

  async getUsersInTenant(tenantId: string): Promise<IUser[]> {
    return User.find({ tenantId }).exec();
  }

  async inviteUser(data: {
    tenantId: string;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  }): Promise<IUser> {
    const user = new User(data);
    return user.save();
  }

  async updateUserRole(tenantId: string, userId: string, role: UserRole): Promise<IUser | null> {
    return User.findOneAndUpdate(
      { _id: userId, tenantId },
      { role },
      { new: true }
    ).exec();
  }

  async removeUser(tenantId: string, userId: string): Promise<void> {
    await User.findOneAndUpdate(
      { _id: userId, tenantId },
      { deletedAt: new Date() }
    ).exec();
  }
}
