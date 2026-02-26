import { Types } from 'mongoose';
import { Status, IStatusDocument, toSlug } from './status.model';
import { CreateStatusDTO, UpdateStatusDTO } from '../../types/status.types';

export class StatusRepository {
  /**
   * Find all statuses for a tenant, sorted by order.
   */
  async findByTenant(tenantId: string): Promise<IStatusDocument[]> {
    return Status.find({ tenantId })
      .sort({ order: 1 })
      .exec();
  }

  /**
   * Find a status by ID within a tenant.
   */
  async findById(id: string, tenantId: string): Promise<IStatusDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return Status.findOne({ _id: id, tenantId }).exec();
  }

  /**
   * Find a status by slug within a tenant.
   */
  async findBySlug(slug: string, tenantId: string): Promise<IStatusDocument | null> {
    return Status.findOne({ slug: slug.toLowerCase(), tenantId }).exec();
  }

  /**
   * Find the default status for a tenant (for new tasks).
   */
  async findDefault(tenantId: string): Promise<IStatusDocument | null> {
    return Status.findOne({ tenantId, isDefault: true }).exec();
  }

  /**
   * Count total statuses for a tenant.
   */
  async countByTenant(tenantId: string): Promise<number> {
    return Status.countDocuments({ tenantId }).exec();
  }

  /**
   * Get the next available order value for a tenant.
   */
  async getNextOrder(tenantId: string): Promise<number> {
    const maxStatus = await Status.findOne({ tenantId })
      .sort({ order: -1 })
      .select('order')
      .exec();
    return maxStatus ? maxStatus.order + 1 : 0;
  }

  /**
   * Generate a unique slug by appending numeric suffix if needed.
   */
  async generateUniqueSlug(baseSlug: string, tenantId: string): Promise<string> {
    let slug = baseSlug;
    let suffix = 1;

    while (await this.findBySlug(slug, tenantId)) {
      slug = `${baseSlug}-${suffix}`;
      suffix++;
    }

    return slug;
  }

  /**
   * Create a new status with auto-generated slug and order if not provided.
   */
  async create(data: CreateStatusDTO): Promise<IStatusDocument> {
    // Auto-generate slug from name if not provided
    const baseSlug = data.slug ?? toSlug(data.name);
    const slug = await this.generateUniqueSlug(baseSlug, data.tenantId);

    // Auto-assign order if not provided
    const order = data.order ?? await this.getNextOrder(data.tenantId);

    // Convert allowedTransitions string[] to ObjectId[]
    const allowedTransitions = data.allowedTransitions?.map(
      (id) => new Types.ObjectId(id)
    ) ?? [];

    // If this is set as default, unset any existing default
    if (data.isDefault) {
      await Status.updateMany(
        { tenantId: data.tenantId, isDefault: true },
        { isDefault: false }
      ).exec();
    }

    const status = new Status({
      tenantId: data.tenantId,
      name: data.name,
      slug,
      color: data.color,
      icon: data.icon ?? 'circle',
      category: data.category,
      order,
      allowedTransitions,
      isDefault: data.isDefault ?? false,
    });

    return status.save();
  }

  /**
   * Update an existing status.
   */
  async update(
    id: string,
    tenantId: string,
    data: UpdateStatusDTO
  ): Promise<IStatusDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.order !== undefined) updateData.order = data.order;

    // Handle slug update with uniqueness check
    if (data.slug !== undefined) {
      const existing = await this.findBySlug(data.slug, tenantId);
      if (existing && existing._id.toString() !== id) {
        // Slug conflict - generate unique slug
        updateData.slug = await this.generateUniqueSlug(data.slug, tenantId);
      } else {
        updateData.slug = data.slug.toLowerCase();
      }
    }

    // Convert allowedTransitions if provided
    if (data.allowedTransitions !== undefined) {
      updateData.allowedTransitions = data.allowedTransitions.map(
        (transitionId) => new Types.ObjectId(transitionId)
      );
    }

    // Handle isDefault flag
    if (data.isDefault === true) {
      // Unset any existing default first
      await Status.updateMany(
        { tenantId, isDefault: true, _id: { $ne: id } },
        { isDefault: false }
      ).exec();
      updateData.isDefault = true;
    } else if (data.isDefault === false) {
      updateData.isDefault = false;
    }

    return Status.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: updateData },
      { new: true }
    ).exec();
  }

  /**
   * Soft delete a status.
   */
  async delete(id: string, tenantId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;

    const result = await Status.findOneAndUpdate(
      { _id: id, tenantId },
      { deletedAt: new Date() }
    ).exec();

    return result !== null;
  }

  /**
   * Bulk reorder statuses by updating their order field.
   * @param tenantId Tenant ID
   * @param orderedIds Array of status IDs in desired order
   */
  async reorder(tenantId: string, orderedIds: string[]): Promise<void> {
    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(id), tenantId },
        update: { $set: { order: index } },
      },
    }));

    if (bulkOps.length > 0) {
      await Status.bulkWrite(bulkOps);
    }
  }

  /**
   * Find multiple statuses by IDs within a tenant.
   */
  async findByIds(ids: string[], tenantId: string): Promise<IStatusDocument[]> {
    const validIds = ids.filter((id) => Types.ObjectId.isValid(id));
    if (validIds.length === 0) return [];

    return Status.find({
      _id: { $in: validIds.map((id) => new Types.ObjectId(id)) },
      tenantId,
    }).exec();
  }

  /**
   * Check if a status transition is allowed.
   */
  async isTransitionAllowed(
    fromStatusId: string,
    toStatusId: string,
    tenantId: string
  ): Promise<boolean> {
    const fromStatus = await this.findById(fromStatusId, tenantId);
    if (!fromStatus) return false;

    // If no transitions defined, allow all
    if (fromStatus.allowedTransitions.length === 0) return true;

    return fromStatus.allowedTransitions.some(
      (transitionId) => transitionId.toString() === toStatusId
    );
  }
}
