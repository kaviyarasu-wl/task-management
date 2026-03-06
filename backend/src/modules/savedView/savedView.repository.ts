import { SavedView, ISavedView, SavedViewEntityType } from './savedView.model';

export interface SavedViewFiltersQuery {
  entityType?: SavedViewEntityType;
}

export class SavedViewRepository {
  async findById(tenantId: string, viewId: string): Promise<ISavedView | null> {
    return SavedView.findOne({ _id: viewId, tenantId, deletedAt: null }).exec();
  }

  /**
   * Find views visible to a user: their own views + shared views from others.
   */
  async findForUser(
    tenantId: string,
    userId: string,
    filters?: SavedViewFiltersQuery
  ): Promise<ISavedView[]> {
    const query: Record<string, unknown> = {
      tenantId,
      deletedAt: null,
      $or: [{ userId }, { isShared: true }],
    };

    if (filters?.entityType) {
      query.entityType = filters.entityType;
    }

    return SavedView.find(query).sort({ isDefault: -1, updatedAt: -1 }).exec();
  }

  async countByUser(tenantId: string, userId: string): Promise<number> {
    return SavedView.countDocuments({ tenantId, userId, deletedAt: null }).exec();
  }

  async create(data: Partial<ISavedView>): Promise<ISavedView> {
    const view = new SavedView(data);
    return view.save();
  }

  async update(
    tenantId: string,
    viewId: string,
    data: Partial<ISavedView>
  ): Promise<ISavedView | null> {
    return SavedView.findOneAndUpdate(
      { _id: viewId, tenantId, deletedAt: null },
      { $set: data },
      { new: true }
    ).exec();
  }

  async softDelete(tenantId: string, viewId: string): Promise<boolean> {
    const result = await SavedView.findOneAndUpdate(
      { _id: viewId, tenantId },
      { deletedAt: new Date() }
    ).exec();
    return result !== null;
  }

  /**
   * Unset isDefault for all views of a user+entityType combo.
   * Called before setting a new default.
   */
  async clearDefaults(
    tenantId: string,
    userId: string,
    entityType: SavedViewEntityType
  ): Promise<void> {
    await SavedView.updateMany(
      { tenantId, userId, entityType, isDefault: true, deletedAt: null },
      { $set: { isDefault: false } }
    ).exec();
  }
}
