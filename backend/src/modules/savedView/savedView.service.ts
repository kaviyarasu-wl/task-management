import { SavedViewRepository, SavedViewFiltersQuery } from './savedView.repository';
import { ISavedView, SavedViewEntityType, SavedViewFilters } from './savedView.model';
import { RequestContext } from '@core/context/RequestContext';
import { BadRequestError, ForbiddenError, NotFoundError } from '@core/errors/AppError';
import { EventBus } from '@core/events/EventBus';

const MAX_VIEWS_PER_USER = 20;

export class SavedViewService {
  private repo: SavedViewRepository;

  constructor() {
    this.repo = new SavedViewRepository();
  }

  async list(filters?: SavedViewFiltersQuery): Promise<ISavedView[]> {
    const { tenantId, userId } = RequestContext.get();
    return this.repo.findForUser(tenantId, userId, filters);
  }

  async create(data: {
    name: string;
    entityType: SavedViewEntityType;
    filters: SavedViewFilters;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    isShared?: boolean;
  }): Promise<ISavedView> {
    const { tenantId, userId } = RequestContext.get();

    const existingCount = await this.repo.countByUser(tenantId, userId);
    if (existingCount >= MAX_VIEWS_PER_USER) {
      throw new BadRequestError(`Maximum ${MAX_VIEWS_PER_USER} saved views per user`);
    }

    const view = await this.repo.create({
      tenantId,
      userId,
      createdBy: userId,
      name: data.name,
      entityType: data.entityType,
      filters: data.filters,
      sortBy: data.sortBy ?? 'createdAt',
      sortOrder: data.sortOrder ?? 'desc',
      isDefault: false,
      isShared: data.isShared ?? false,
    });

    await EventBus.emit('savedView.created', {
      viewId: view.id as string,
      tenantId,
      userId,
    });

    return view;
  }

  async update(
    viewId: string,
    data: {
      name?: string;
      filters?: SavedViewFilters;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      isShared?: boolean;
    }
  ): Promise<ISavedView> {
    const { tenantId, userId } = RequestContext.get();

    const existing = await this.repo.findById(tenantId, viewId);
    if (!existing) throw new NotFoundError('Saved view');

    if (existing.createdBy !== userId) {
      throw new ForbiddenError('Only the creator can edit this view');
    }

    const updated = await this.repo.update(tenantId, viewId, data);
    if (!updated) throw new NotFoundError('Saved view');

    await EventBus.emit('savedView.updated', {
      viewId,
      tenantId,
      userId,
    });

    return updated;
  }

  async delete(viewId: string): Promise<void> {
    const { tenantId, userId } = RequestContext.get();

    const existing = await this.repo.findById(tenantId, viewId);
    if (!existing) throw new NotFoundError('Saved view');

    if (existing.createdBy !== userId) {
      throw new ForbiddenError('Only the creator can delete this view');
    }

    await this.repo.softDelete(tenantId, viewId);

    await EventBus.emit('savedView.deleted', {
      viewId,
      tenantId,
      userId,
    });
  }

  async setDefault(viewId: string, isDefault: boolean): Promise<ISavedView> {
    const { tenantId, userId } = RequestContext.get();

    const existing = await this.repo.findById(tenantId, viewId);
    if (!existing) throw new NotFoundError('Saved view');

    if (existing.userId !== userId) {
      throw new ForbiddenError('You can only set your own views as default');
    }

    if (isDefault) {
      await this.repo.clearDefaults(tenantId, userId, existing.entityType);
    }

    const updated = await this.repo.update(tenantId, viewId, { isDefault });
    if (!updated) throw new NotFoundError('Saved view');

    return updated;
  }
}
