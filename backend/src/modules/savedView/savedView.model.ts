import { Schema, model } from 'mongoose';
import { applyBaseSchema, BaseDocument } from '@infrastructure/database/mongodb/baseModel';

export type SavedViewEntityType = 'tasks' | 'projects';

export interface SavedViewFilters {
  projectId?: string;
  assigneeId?: string;
  status?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
  dueDateFrom?: Date;
  dueDateTo?: Date;
  search?: string;
}

export interface ISavedView extends BaseDocument {
  userId: string;
  name: string;
  entityType: SavedViewEntityType;
  filters: SavedViewFilters;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  isDefault: boolean;
  isShared: boolean;
  createdBy: string;
}

const savedViewSchema = new Schema<ISavedView>({
  userId: { type: String, required: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  entityType: {
    type: String,
    enum: ['tasks', 'projects'],
    required: true,
  },
  filters: {
    type: {
      projectId: { type: String },
      assigneeId: { type: String },
      status: { type: String },
      priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'] },
      tags: { type: [String] },
      dueDateFrom: { type: Date },
      dueDateTo: { type: Date },
      search: { type: String },
    },
    default: {},
  },
  sortBy: { type: String, default: 'createdAt' },
  sortOrder: { type: String, enum: ['asc', 'desc'], default: 'desc' },
  isDefault: { type: Boolean, default: false },
  isShared: { type: Boolean, default: false },
  createdBy: { type: String, required: true },
});

applyBaseSchema(savedViewSchema);

savedViewSchema.index({ tenantId: 1, userId: 1, entityType: 1 });
savedViewSchema.index({ tenantId: 1, userId: 1, isDefault: 1, entityType: 1 });
savedViewSchema.index({ tenantId: 1, isShared: 1, entityType: 1 });

export const SavedView = model<ISavedView>('SavedView', savedViewSchema);
