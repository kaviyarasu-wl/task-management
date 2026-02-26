import { StatusRepository } from './status.repository';
import { TransitionService } from './transition.service';
import { IStatusDocument, toSlug } from './status.model';
import { Task } from '../task/task.model';
import { cache } from '@infrastructure/redis/cache';
import { RequestContext } from '@core/context/RequestContext';
import { NotFoundError, ConflictError, ValidationError } from '@core/errors/AppError';
import { EventBus } from '@core/events/EventBus';
import { CreateStatusDTO, UpdateStatusDTO, TransitionMatrix } from '../../types/status.types';

/** Cache TTL in seconds (5 minutes) */
const CACHE_TTL_SECONDS = 300;

/** Cache key helper for status list per tenant */
const cacheKey = (tenantId: string): string => `cache:${tenantId}:statuses:list`;

export class StatusService {
  private repo: StatusRepository;
  private transitionService: TransitionService;

  constructor() {
    this.repo = new StatusRepository();
    this.transitionService = new TransitionService();
  }

  /**
   * Get all statuses for the current tenant, sorted by order.
   * Uses cache-first strategy with 5 minute TTL.
   */
  async getAll(): Promise<IStatusDocument[]> {
    const { tenantId } = RequestContext.get();

    return cache.getOrSet(
      cacheKey(tenantId),
      () => this.repo.findByTenant(tenantId),
      CACHE_TTL_SECONDS
    );
  }

  /**
   * Get a single status by ID.
   * @throws NotFoundError if status doesn't exist
   */
  async getById(id: string): Promise<IStatusDocument> {
    const { tenantId } = RequestContext.get();
    const status = await this.repo.findById(id, tenantId);

    if (!status) {
      throw new NotFoundError('Status');
    }

    return status;
  }

  /**
   * Get the default status for new tasks.
   * Returns the status with isDefault=true, or first by order if none set.
   */
  async getDefault(): Promise<IStatusDocument> {
    const { tenantId } = RequestContext.get();

    const defaultStatus = await this.repo.findDefault(tenantId);
    if (defaultStatus) {
      return defaultStatus;
    }

    // Fallback to first status by order
    const statuses = await this.repo.findByTenant(tenantId);
    if (statuses.length === 0) {
      throw new NotFoundError('Status');
    }

    return statuses[0];
  }

  /**
   * Create a new status.
   * - Validates unique name within tenant
   * - Auto-generates slug if not provided
   * - Auto-assigns order (max + 1)
   * - Sets as default if first status for tenant
   */
  async create(data: Omit<CreateStatusDTO, 'tenantId'>): Promise<IStatusDocument> {
    const { tenantId } = RequestContext.get();

    // Validate unique name within tenant
    const existingByName = await this.findByName(data.name, tenantId);
    if (existingByName) {
      throw new ConflictError(`Status with name "${data.name}" already exists`);
    }

    // Check if this is the first status for tenant
    const statusCount = await this.repo.countByTenant(tenantId);
    const isFirstStatus = statusCount === 0;

    const createData: CreateStatusDTO = {
      ...data,
      tenantId,
      // Set as default if first status or explicitly requested
      isDefault: isFirstStatus || data.isDefault,
    };

    const status = await this.repo.create(createData);

    // Invalidate cache
    await this.invalidateCache(tenantId);

    // Emit event for potential listeners
    await EventBus.emit('status.created', {
      statusId: status._id.toString(),
      tenantId,
    });

    return status;
  }

  /**
   * Update an existing status.
   * - Regenerates slug if name changes
   * - Validates unique name within tenant
   */
  async update(id: string, data: UpdateStatusDTO): Promise<IStatusDocument> {
    const { tenantId } = RequestContext.get();

    // Verify status exists
    const existing = await this.repo.findById(id, tenantId);
    if (!existing) {
      throw new NotFoundError('Status');
    }

    // If name is changing, validate uniqueness
    if (data.name && data.name !== existing.name) {
      const existingByName = await this.findByName(data.name, tenantId);
      if (existingByName && existingByName._id.toString() !== id) {
        throw new ConflictError(`Status with name "${data.name}" already exists`);
      }

      // Regenerate slug from new name
      data.slug = toSlug(data.name);
    }

    const updated = await this.repo.update(id, tenantId, data);
    if (!updated) {
      throw new NotFoundError('Status');
    }

    // Invalidate cache
    await this.invalidateCache(tenantId);

    // Emit event
    await EventBus.emit('status.updated', {
      statusId: id,
      tenantId,
    });

    return updated;
  }

  /**
   * Delete a status.
   * - Cannot delete if status is in use by tasks
   * - Cannot delete the only remaining status
   * - Transfers default to next status if deleting default
   */
  async delete(id: string): Promise<void> {
    const { tenantId } = RequestContext.get();

    // Verify status exists
    const status = await this.repo.findById(id, tenantId);
    if (!status) {
      throw new NotFoundError('Status');
    }

    // Check if this is the only status
    const statusCount = await this.repo.countByTenant(tenantId);
    if (statusCount <= 1) {
      throw new ConflictError('Cannot delete the only remaining status');
    }

    // Check if status is in use by tasks
    const taskCount = await this.countTasksByStatus(id, tenantId);
    if (taskCount > 0) {
      throw new ConflictError(
        `Cannot delete status: ${taskCount} task${taskCount > 1 ? 's' : ''} currently use this status. ` +
        `Reassign tasks to another status before deleting.`
      );
    }

    // If deleting default status, transfer default to next status
    if (status.isDefault) {
      await this.transferDefault(id, tenantId);
    }

    // Remove this status from all other statuses' allowedTransitions arrays
    await this.transitionService.removeTransitionReferences(id, tenantId);

    // Delete the status (soft delete)
    const deleted = await this.repo.delete(id, tenantId);
    if (!deleted) {
      throw new NotFoundError('Status');
    }

    // Reorder remaining statuses to fill the gap
    await this.compactOrder(tenantId);

    // Invalidate cache
    await this.invalidateCache(tenantId);

    // Emit event
    await EventBus.emit('status.deleted', {
      statusId: id,
      tenantId,
    });
  }

  /**
   * Reorder statuses by providing ordered array of status IDs.
   * - Validates all IDs belong to tenant
   * - Validates no missing or extra IDs
   */
  async reorder(orderedIds: string[]): Promise<IStatusDocument[]> {
    const { tenantId } = RequestContext.get();

    // Get all current statuses for tenant
    const currentStatuses = await this.repo.findByTenant(tenantId);
    const currentIds = new Set(currentStatuses.map((s) => s._id.toString()));

    // Validate provided IDs
    const providedIds = new Set(orderedIds);

    // Check for invalid IDs (not belonging to tenant)
    const invalidIds = orderedIds.filter((id) => !currentIds.has(id));
    if (invalidIds.length > 0) {
      throw new ValidationError({
        orderedIds: [`Invalid status IDs: ${invalidIds.join(', ')}`],
      });
    }

    // Check for missing IDs
    const missingIds = [...currentIds].filter((id) => !providedIds.has(id));
    if (missingIds.length > 0) {
      throw new ValidationError({
        orderedIds: [`Missing status IDs: ${missingIds.join(', ')}`],
      });
    }

    // Check for duplicates
    if (providedIds.size !== orderedIds.length) {
      throw new ValidationError({
        orderedIds: ['Duplicate status IDs detected'],
      });
    }

    // Perform bulk reorder
    await this.repo.reorder(tenantId, orderedIds);

    // Invalidate cache
    await this.invalidateCache(tenantId);

    // Emit event
    await EventBus.emit('status.reordered', {
      tenantId,
      statusIds: orderedIds,
    });

    // Return reordered list
    return this.repo.findByTenant(tenantId);
  }

  /**
   * Set a status as the default for new tasks.
   * Unsets current default before setting new one.
   */
  async setDefault(id: string): Promise<IStatusDocument> {
    const { tenantId } = RequestContext.get();

    // Verify status exists
    const status = await this.repo.findById(id, tenantId);
    if (!status) {
      throw new NotFoundError('Status');
    }

    // Update to set as default (repository handles unsetting previous default)
    const updated = await this.repo.update(id, tenantId, { isDefault: true });
    if (!updated) {
      throw new NotFoundError('Status');
    }

    // Invalidate cache
    await this.invalidateCache(tenantId);

    // Emit event
    await EventBus.emit('status.defaultChanged', {
      statusId: id,
      tenantId,
    });

    return updated;
  }

  /**
   * Check if a status transition is allowed by workflow rules.
   */
  async isTransitionAllowed(fromStatusId: string, toStatusId: string): Promise<boolean> {
    const { tenantId } = RequestContext.get();
    return this.transitionService.isTransitionAllowed(fromStatusId, toStatusId, tenantId);
  }

  /**
   * Get the full transition matrix for the tenant.
   * Returns a map of source status IDs to arrays of allowed target status IDs.
   */
  async getTransitionMatrix(): Promise<TransitionMatrix> {
    return this.transitionService.getTransitionMatrix();
  }

  /**
   * Update the allowed transitions for a status.
   * Validates that all target status IDs exist and prevents self-transitions.
   */
  async setTransitions(id: string, allowedIds: string[]): Promise<IStatusDocument> {
    const { tenantId } = RequestContext.get();

    const updated = await this.transitionService.updateTransitions(id, allowedIds, tenantId);

    // Invalidate cache
    await this.invalidateCache(tenantId);

    // Emit event
    await EventBus.emit('status.transitionsUpdated', {
      statusId: id,
      tenantId,
      allowedTransitions: allowedIds,
    });

    return updated;
  }

  /**
   * Get the list of statuses that a task can transition to from the given status.
   */
  async getAvailableTransitions(statusId: string): Promise<IStatusDocument[]> {
    return this.transitionService.getAvailableTransitions(statusId);
  }

  // ============================================================
  // Private helper methods
  // ============================================================

  /**
   * Find a status by exact name within a tenant.
   */
  private async findByName(name: string, tenantId: string): Promise<IStatusDocument | null> {
    const statuses = await this.repo.findByTenant(tenantId);
    return statuses.find(
      (s) => s.name.toLowerCase() === name.toLowerCase()
    ) ?? null;
  }

  /**
   * Count tasks using a specific status.
   * Used to prevent deletion of statuses in use.
   */
  private async countTasksByStatus(statusId: string, tenantId: string): Promise<number> {
    // Tasks use status field as ObjectId reference to Status collection
    return Task.countDocuments({
      tenantId,
      status: statusId,
      deletedAt: null,
    }).exec();
  }

  /**
   * Transfer default flag to the next available status.
   * Called when deleting the current default status.
   */
  private async transferDefault(excludeId: string, tenantId: string): Promise<void> {
    const statuses = await this.repo.findByTenant(tenantId);
    const nextStatus = statuses.find((s) => s._id.toString() !== excludeId);

    if (nextStatus) {
      await this.repo.update(nextStatus._id.toString(), tenantId, { isDefault: true });
    }
  }

  /**
   * Compact order values to remove gaps after deletion.
   * Reassigns order 0, 1, 2, ... based on current sort order.
   */
  private async compactOrder(tenantId: string): Promise<void> {
    const statuses = await this.repo.findByTenant(tenantId);
    const orderedIds = statuses.map((s) => s._id.toString());
    await this.repo.reorder(tenantId, orderedIds);
  }

  /**
   * Invalidate the status cache for a tenant.
   */
  private async invalidateCache(tenantId: string): Promise<void> {
    try {
      await cache.del(cacheKey(tenantId));
    } catch {
      // Log but don't fail if cache is unavailable
      console.warn(`Failed to invalidate status cache for tenant ${tenantId}`);
    }
  }
}
