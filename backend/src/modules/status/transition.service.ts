import { StatusRepository } from './status.repository';
import { IStatusDocument } from './status.model';
import { Task } from '../task/task.model';
import { cache } from '@infrastructure/redis/cache';
import { RequestContext } from '@core/context/RequestContext';
import { NotFoundError, ValidationError, TransitionNotAllowedError } from '@core/errors/AppError';
import { TransitionMatrix, TransitionValidationResult } from '../../types/status.types';

/** Cache TTL in seconds (5 minutes) */
const CACHE_TTL_SECONDS = 300;

/** Cache key helper for transition matrix per tenant */
const transitionMatrixCacheKey = (tenantId: string): string =>
  `cache:${tenantId}:statuses:transitions`;

export class TransitionService {
  private repo: StatusRepository;

  constructor() {
    this.repo = new StatusRepository();
  }

  /**
   * Check if a transition from one status to another is allowed.
   * Returns true if the transition is valid, false otherwise.
   */
  async isTransitionAllowed(
    fromStatusId: string,
    toStatusId: string,
    tenantId?: string
  ): Promise<boolean> {
    const resolvedTenantId = tenantId ?? RequestContext.get().tenantId;

    // Self-transition is never allowed
    if (fromStatusId === toStatusId) {
      return false;
    }

    return this.repo.isTransitionAllowed(fromStatusId, toStatusId, resolvedTenantId);
  }

  /**
   * Get the full transition matrix for a tenant.
   * Returns a map of source status IDs to arrays of allowed target status IDs.
   * Uses caching for performance.
   */
  async getTransitionMatrix(tenantId?: string): Promise<TransitionMatrix> {
    const resolvedTenantId = tenantId ?? RequestContext.get().tenantId;

    return cache.getOrSet(
      transitionMatrixCacheKey(resolvedTenantId),
      async () => {
        const statuses = await this.repo.findByTenant(resolvedTenantId);
        const matrix: TransitionMatrix = {};

        for (const status of statuses) {
          const statusId = status._id.toString();
          matrix[statusId] = status.allowedTransitions.map((t) => t.toString());
        }

        return matrix;
      },
      CACHE_TTL_SECONDS
    );
  }

  /**
   * Update the allowed transitions for a status.
   * Validates that all target status IDs exist and prevents self-transitions.
   * @throws ValidationError if target IDs are invalid or include self-transition
   * @throws NotFoundError if source status doesn't exist
   */
  async updateTransitions(
    statusId: string,
    allowedIds: string[],
    tenantId?: string
  ): Promise<IStatusDocument> {
    const resolvedTenantId = tenantId ?? RequestContext.get().tenantId;

    // Verify source status exists
    const sourceStatus = await this.repo.findById(statusId, resolvedTenantId);
    if (!sourceStatus) {
      throw new NotFoundError('Status');
    }

    // Remove duplicates
    const uniqueAllowedIds = [...new Set(allowedIds)];

    // Validate no self-transitions
    if (uniqueAllowedIds.includes(statusId)) {
      throw new ValidationError({
        allowedTransitions: ['Self-transitions are not allowed (A → A)'],
      });
    }

    // Validate all target IDs exist within tenant
    if (uniqueAllowedIds.length > 0) {
      const targetStatuses = await this.repo.findByIds(uniqueAllowedIds, resolvedTenantId);
      const foundIds = new Set(targetStatuses.map((s) => s._id.toString()));
      const invalidIds = uniqueAllowedIds.filter((id) => !foundIds.has(id));

      if (invalidIds.length > 0) {
        throw new ValidationError({
          allowedTransitions: [`Invalid status IDs: ${invalidIds.join(', ')}`],
        });
      }
    }

    // Update the status
    const updated = await this.repo.update(statusId, resolvedTenantId, {
      allowedTransitions: uniqueAllowedIds,
    });

    if (!updated) {
      throw new NotFoundError('Status');
    }

    // Invalidate cache
    await this.invalidateCache(resolvedTenantId);

    return updated;
  }

  /**
   * Get the list of statuses that a task can transition to from its current status.
   * @throws NotFoundError if source status doesn't exist
   */
  async getAvailableTransitions(
    statusId: string,
    tenantId?: string
  ): Promise<IStatusDocument[]> {
    const resolvedTenantId = tenantId ?? RequestContext.get().tenantId;

    // Get source status
    const sourceStatus = await this.repo.findById(statusId, resolvedTenantId);
    if (!sourceStatus) {
      throw new NotFoundError('Status');
    }

    // If no transitions defined, return all other statuses (permissive mode)
    if (sourceStatus.allowedTransitions.length === 0) {
      const allStatuses = await this.repo.findByTenant(resolvedTenantId);
      return allStatuses.filter((s) => s._id.toString() !== statusId);
    }

    // Return only allowed transitions
    const allowedIds = sourceStatus.allowedTransitions.map((t) => t.toString());
    return this.repo.findByIds(allowedIds, resolvedTenantId);
  }

  /**
   * Validate that a task can transition to a new status.
   * Gets task's current status and checks if transition is allowed.
   * @throws NotFoundError if task or status doesn't exist
   * @throws TransitionNotAllowedError if transition is not permitted
   */
  async validateTaskTransition(
    taskId: string,
    newStatusId: string,
    tenantId?: string
  ): Promise<void> {
    const resolvedTenantId = tenantId ?? RequestContext.get().tenantId;

    // Get the task to find current status
    const task = await Task.findOne({
      _id: taskId,
      tenantId: resolvedTenantId,
      deletedAt: null,
    }).exec();

    if (!task) {
      throw new NotFoundError('Task');
    }

    // Get current status ID from task
    // Task model uses status field as ObjectId reference to Status collection
    const currentStatusId = task.status?.toString();

    // If task has no status (shouldn't happen), allow transition
    if (!currentStatusId) {
      return;
    }

    // Same status - no transition needed
    if (currentStatusId === newStatusId) {
      return;
    }

    // Validate the new status exists
    const newStatus = await this.repo.findById(newStatusId, resolvedTenantId);
    if (!newStatus) {
      throw new NotFoundError('Status');
    }

    // Check if transition is allowed
    const validationResult = await this.validateTransitionWithNames(
      currentStatusId,
      newStatusId,
      resolvedTenantId
    );

    if (!validationResult.isAllowed) {
      throw new TransitionNotAllowedError(
        validationResult.fromStatusName,
        validationResult.toStatusName
      );
    }
  }

  /**
   * Remove a deleted status from all other statuses' allowedTransitions arrays.
   * Called when a status is being deleted to clean up references.
   */
  async removeTransitionReferences(
    deletedStatusId: string,
    tenantId: string
  ): Promise<void> {
    const statuses = await this.repo.findByTenant(tenantId);

    for (const status of statuses) {
      const hasReference = status.allowedTransitions.some(
        (t) => t.toString() === deletedStatusId
      );

      if (hasReference) {
        const updatedTransitions = status.allowedTransitions
          .filter((t) => t.toString() !== deletedStatusId)
          .map((t) => t.toString());

        await this.repo.update(status._id.toString(), tenantId, {
          allowedTransitions: updatedTransitions,
        });
      }
    }

    // Invalidate cache
    await this.invalidateCache(tenantId);
  }

  /**
   * Validate transition and return status names for error messages.
   */
  private async validateTransitionWithNames(
    fromStatusId: string,
    toStatusId: string,
    tenantId: string
  ): Promise<TransitionValidationResult> {
    const [fromStatus, toStatus] = await Promise.all([
      this.repo.findById(fromStatusId, tenantId),
      this.repo.findById(toStatusId, tenantId),
    ]);

    const fromStatusName = fromStatus?.name ?? 'Unknown';
    const toStatusName = toStatus?.name ?? 'Unknown';

    // Self-transition not allowed
    if (fromStatusId === toStatusId) {
      return { isAllowed: false, fromStatusName, toStatusName };
    }

    // If source status not found, deny
    if (!fromStatus) {
      return { isAllowed: false, fromStatusName, toStatusName };
    }

    // If no transitions defined (empty array), allow all (permissive mode)
    if (fromStatus.allowedTransitions.length === 0) {
      return { isAllowed: true, fromStatusName, toStatusName };
    }

    // Check if target is in allowed list
    const isAllowed = fromStatus.allowedTransitions.some(
      (t) => t.toString() === toStatusId
    );

    return { isAllowed, fromStatusName, toStatusName };
  }

  /**
   * Invalidate the transition cache for a tenant.
   */
  private async invalidateCache(tenantId: string): Promise<void> {
    try {
      await cache.del(transitionMatrixCacheKey(tenantId));
    } catch {
      console.warn(`Failed to invalidate transition cache for tenant ${tenantId}`);
    }
  }
}

// Export singleton instance for convenience
export const transitionService = new TransitionService();
