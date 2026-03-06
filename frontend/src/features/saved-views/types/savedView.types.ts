import type { TaskPriority } from '@/shared/types/api.types';

export interface SavedViewFilters {
  projectId?: string;
  statusId?: string;
  priority?: TaskPriority;
  assigneeId?: string;
}

export interface SavedView {
  _id: string;
  name: string;
  filters: SavedViewFilters;
  isShared: boolean;
  isDefault: boolean;
  createdBy: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSavedViewData {
  name: string;
  filters: SavedViewFilters;
  isShared: boolean;
}

export interface UpdateSavedViewData {
  name?: string;
  filters?: SavedViewFilters;
  isShared?: boolean;
}
