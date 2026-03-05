import { PlanRepository, CreatePlanDto, UpdatePlanDto } from './plan.repository';
import { Plan, IPlan } from './models/plan.model';
import { Tenant, ITenant } from '@modules/tenant/tenant.model';
import { User, IUser } from '@modules/user/user.model';
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
} from '@core/errors/AppError';
import { EventBus } from '@core/events/EventBus';
import bcrypt from 'bcryptjs';

export interface TenantFilters {
  search?: string;
  planId?: string;
  status?: 'active' | 'suspended' | 'all';
  page?: number;
  limit?: number;
}

export interface UserFilters {
  search?: string;
  tenantId?: string;
  role?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TenantStats {
  userCount: number;
  projectCount: number;
}

export interface TenantWithStats {
  tenant: ITenant;
  stats: TenantStats;
}

export interface UserWithTenant {
  user: IUser;
  tenant?: ITenant;
}

export interface DashboardStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  activeUsers: number;
  totalPlans: number;
  recentTenants: ITenant[];
}

export class AdminService {
  private planRepo = new PlanRepository();

  // ============ PLAN MANAGEMENT ============

  async listPlans(): Promise<IPlan[]> {
    return this.planRepo.findAll();
  }

  async getPlan(planId: string): Promise<IPlan> {
    const plan = await this.planRepo.findById(planId);
    if (!plan) throw new NotFoundError('Plan');
    return plan;
  }

  async createPlan(data: CreatePlanDto): Promise<IPlan> {
    // Check slug uniqueness
    const existing = await this.planRepo.findBySlug(data.slug);
    if (existing) {
      throw new ConflictError('Plan slug already exists');
    }

    const plan = await this.planRepo.create(data);

    await EventBus.emit('admin.plan.created', { planId: plan._id.toString() });

    return plan;
  }

  async updatePlan(planId: string, data: UpdatePlanDto): Promise<IPlan> {
    // If changing slug, check uniqueness
    if (data.slug) {
      const existing = await this.planRepo.findBySlug(data.slug);
      if (existing && existing._id.toString() !== planId) {
        throw new ConflictError('Plan slug already exists');
      }
    }

    const plan = await this.planRepo.update(planId, data);

    await EventBus.emit('admin.plan.updated', { planId: plan._id.toString() });

    return plan;
  }

  async deletePlan(planId: string): Promise<void> {
    // Check if any tenants use this plan
    const tenantCount = await Tenant.countDocuments({ planId });
    if (tenantCount > 0) {
      throw new BadRequestError(
        `Cannot delete plan: ${tenantCount} tenant(s) are using it. ` +
          'Migrate tenants to another plan first.'
      );
    }

    await this.planRepo.delete(planId);

    await EventBus.emit('admin.plan.deleted', { planId });
  }

  async setDefaultPlan(planId: string): Promise<IPlan> {
    return this.planRepo.setDefault(planId);
  }

  // ============ TENANT MANAGEMENT ============

  async listTenants(filters: TenantFilters): Promise<PaginatedResult<ITenant>> {
    const { search, planId, status = 'all', page = 1, limit = 20 } = filters;

    const query: Record<string, unknown> = {};

    // Search by name or slug
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by plan
    if (planId) {
      query.planId = planId;
    }

    // Filter by status
    if (status === 'active') {
      query.isActive = true;
      query.suspendedAt = { $exists: false };
    } else if (status === 'suspended') {
      query.suspendedAt = { $exists: true };
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Tenant.find(query)
        .populate('planId', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Tenant.countDocuments(query),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getTenant(tenantId: string): Promise<TenantWithStats> {
    const tenant = await Tenant.findOne({ tenantId }).populate('planId');

    if (!tenant) throw new NotFoundError('Tenant');

    // Get stats
    const [userCount, projectCount] = await Promise.all([
      User.countDocuments({ tenantId, deletedAt: null }),
      // Note: Project model may not exist, using placeholder
      Promise.resolve(0),
    ]);

    return {
      tenant,
      stats: {
        userCount,
        projectCount,
      },
    };
  }

  async updateTenant(
    tenantId: string,
    data: {
      name?: string;
      settings?: Partial<ITenant['settings']>;
    }
  ): Promise<ITenant> {
    const updateData: Record<string, unknown> = {};

    if (data.name) {
      updateData.name = data.name;
    }

    if (data.settings) {
      // Merge settings using dot notation to preserve unset fields
      for (const [key, value] of Object.entries(data.settings)) {
        updateData[`settings.${key}`] = value;
      }
    }

    const tenant = await Tenant.findOneAndUpdate(
      { tenantId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!tenant) throw new NotFoundError('Tenant');

    return tenant;
  }

  async changeTenantPlan(tenantId: string, newPlanId: string): Promise<ITenant> {
    // Verify plan exists
    const plan = await this.planRepo.findById(newPlanId);
    if (!plan) throw new NotFoundError('Plan');

    const tenant = await Tenant.findOne({ tenantId });
    if (!tenant) throw new NotFoundError('Tenant');

    const oldPlanId = tenant.planId?.toString();

    const updatedTenant = await Tenant.findOneAndUpdate(
      { tenantId },
      {
        planId: newPlanId,
        // Update settings based on plan limits
        'settings.maxUsers': plan.usersLimit,
        'settings.maxProjects': plan.projectsLimit,
      },
      { new: true }
    ).populate('planId');

    if (!updatedTenant) throw new NotFoundError('Tenant');

    await EventBus.emit('admin.tenant.planChanged', {
      tenantId,
      oldPlanId: oldPlanId ?? '',
      newPlanId,
    });

    return updatedTenant;
  }

  async suspendTenant(tenantId: string, reason: string): Promise<ITenant> {
    const tenant = await Tenant.findOneAndUpdate(
      { tenantId },
      {
        isActive: false,
        suspendedAt: new Date(),
        suspendedReason: reason,
      },
      { new: true }
    );

    if (!tenant) throw new NotFoundError('Tenant');

    await EventBus.emit('admin.tenant.suspended', { tenantId, reason });

    return tenant;
  }

  async activateTenant(tenantId: string): Promise<ITenant> {
    const tenant = await Tenant.findOneAndUpdate(
      { tenantId },
      {
        isActive: true,
        $unset: { suspendedAt: 1, suspendedReason: 1 },
      },
      { new: true }
    );

    if (!tenant) throw new NotFoundError('Tenant');

    await EventBus.emit('admin.tenant.activated', { tenantId });

    return tenant;
  }

  // ============ USER MANAGEMENT ============

  async listUsers(filters: UserFilters): Promise<PaginatedResult<IUser>> {
    const { search, tenantId, role, page = 1, limit = 20 } = filters;

    const query: Record<string, unknown> = { deletedAt: null };

    // Search by email or name
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by tenant
    if (tenantId) {
      query.tenantId = tenantId;
    }

    // Filter by role
    if (role) {
      query.role = role;
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(query),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUser(userId: string): Promise<UserWithTenant> {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User');

    const tenant = await Tenant.findOne({ tenantId: user.tenantId });

    return {
      user,
      tenant: tenant ?? undefined,
    };
  }

  async updateUser(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      role?: string;
    }
  ): Promise<IUser> {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!user) throw new NotFoundError('User');

    return user;
  }

  async moveUserToTenant(
    userId: string,
    targetTenantId: string,
    newRole: string = 'member'
  ): Promise<IUser> {
    // Verify target tenant exists
    const targetTenant = await Tenant.findOne({ tenantId: targetTenantId });
    if (!targetTenant) throw new NotFoundError('Target tenant');

    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User');

    const oldTenantId = user.tenantId;

    // Check if user with same email exists in target tenant
    const existingInTarget = await User.findOne({
      email: user.email,
      tenantId: targetTenantId,
      _id: { $ne: userId },
    });

    if (existingInTarget) {
      throw new ConflictError(
        'User with this email already exists in the target tenant'
      );
    }

    user.tenantId = targetTenantId;
    user.role = newRole as IUser['role'];
    await user.save();

    await EventBus.emit('admin.user.moved', {
      userId,
      oldTenantId,
      newTenantId: targetTenantId,
    });

    return user;
  }

  async deleteUserPermanently(userId: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User');

    // Check if user is an owner
    const tenant = await Tenant.findOne({ ownerId: userId });
    if (tenant) {
      throw new BadRequestError(
        'Cannot delete tenant owner. Transfer ownership first.'
      );
    }

    // Hard delete
    await User.findByIdAndDelete(userId);

    await EventBus.emit('admin.user.deleted', { userId, email: user.email });
  }

  async resetUserPassword(userId: string): Promise<string> {
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) throw new NotFoundError('User');

    // Generate temp password
    const tempPassword = this.generateTempPassword();

    // Hash and save
    user.passwordHash = await bcrypt.hash(tempPassword, 12);
    await user.save();

    // TODO: Send email notification

    return tempPassword;
  }

  private generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  // ============ DASHBOARD STATS ============

  async getDashboardStats(): Promise<DashboardStats> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalTenants,
      activeTenants,
      totalUsers,
      activeUsers,
      totalPlans,
      recentTenants,
    ] = await Promise.all([
      Tenant.countDocuments(),
      Tenant.countDocuments({ isActive: true, suspendedAt: { $exists: false } }),
      User.countDocuments({ deletedAt: null }),
      User.countDocuments({
        deletedAt: null,
        lastLoginAt: { $gte: thirtyDaysAgo },
      }),
      Plan.countDocuments({ isActive: true }),
      Tenant.find()
        .populate('planId', 'name')
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    return {
      totalTenants,
      activeTenants,
      totalUsers,
      activeUsers,
      totalPlans,
      recentTenants,
    };
  }
}
