import { User, IUser } from '../user/user.model';
import { Tenant, ITenant } from '../tenant/tenant.model';

export class AuthRepository {
  async findUserByEmail(tenantId: string, email: string): Promise<IUser | null> {
    // passwordHash is excluded by default (select: false) — explicitly include it for auth
    return User.findOne({ tenantId, email }).select('+passwordHash').exec();
  }

  async findUserById(userId: string): Promise<IUser | null> {
    return User.findById(userId).exec();
  }

  async createUser(data: {
    tenantId: string;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    role: IUser['role'];
  }): Promise<IUser> {
    const user = new User(data);
    return user.save();
  }

  async updateLastLogin(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { lastLoginAt: new Date() }).exec();
  }

  async findTenantBySlug(slug: string): Promise<ITenant | null> {
    return Tenant.findOne({ slug, isActive: true }).exec();
  }

  async createTenant(data: {
    tenantId: string;
    name: string;
    slug: string;
    ownerId: string;
  }): Promise<ITenant> {
    const tenant = new Tenant({ ...data });
    return tenant.save();
  }
}
