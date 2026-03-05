import { Plan, IPlan } from './models/plan.model';
import { NotFoundError } from '@core/errors/AppError';

export interface CreatePlanDto {
  name: string;
  slug: string;
  description?: string;
  projectsLimit: number;
  usersLimit: number;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features?: string[];
  isActive?: boolean;
  isDefault?: boolean;
  sortOrder?: number;
}

export type UpdatePlanDto = Partial<CreatePlanDto>;

export class PlanRepository {
  async findAll(): Promise<IPlan[]> {
    return Plan.find().sort({ sortOrder: 1, createdAt: 1 }).exec();
  }

  async findActive(): Promise<IPlan[]> {
    return Plan.find({ isActive: true }).sort({ sortOrder: 1 }).exec();
  }

  async findById(planId: string): Promise<IPlan | null> {
    return Plan.findById(planId).exec();
  }

  async findBySlug(slug: string): Promise<IPlan | null> {
    return Plan.findOne({ slug }).exec();
  }

  async findDefault(): Promise<IPlan | null> {
    return Plan.findOne({ isDefault: true, isActive: true }).exec();
  }

  async create(data: CreatePlanDto): Promise<IPlan> {
    const plan = new Plan(data);
    return plan.save();
  }

  async update(planId: string, data: UpdatePlanDto): Promise<IPlan> {
    const plan = await Plan.findByIdAndUpdate(
      planId,
      { $set: data },
      { new: true, runValidators: true }
    ).exec();

    if (!plan) {
      throw new NotFoundError('Plan');
    }

    return plan;
  }

  async delete(planId: string): Promise<void> {
    const result = await Plan.findByIdAndDelete(planId).exec();
    if (!result) {
      throw new NotFoundError('Plan');
    }
  }

  async clearDefaultFlag(): Promise<void> {
    await Plan.updateMany({ isDefault: true }, { isDefault: false }).exec();
  }

  async setDefault(planId: string): Promise<IPlan> {
    await this.clearDefaultFlag();
    return this.update(planId, { isDefault: true });
  }

  async countTenantsOnPlan(planId: string): Promise<number> {
    // Import dynamically to avoid circular dependency
    const { Tenant } = await import('@modules/tenant/tenant.model');
    return Tenant.countDocuments({ planId }).exec();
  }

  async isSlugAvailable(slug: string, excludePlanId?: string): Promise<boolean> {
    const query: { slug: string; _id?: { $ne: string } } = { slug };
    if (excludePlanId) {
      query._id = { $ne: excludePlanId };
    }
    const existing = await Plan.findOne(query).exec();
    return !existing;
  }
}
