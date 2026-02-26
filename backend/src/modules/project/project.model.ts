import { Schema, model } from 'mongoose';
import { applyBaseSchema, BaseDocument } from '@infrastructure/database/mongodb/baseModel';

export interface IProject extends BaseDocument {
  name: string;
  description?: string;
  ownerId: string;
  memberIds: string[];
  isArchived: boolean;
  color?: string; // Hex color for UI display
}

const projectSchema = new Schema<IProject>({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  ownerId: { type: String, required: true },
  memberIds: { type: [String], default: [] },
  isArchived: { type: Boolean, default: false },
  color: { type: String, match: /^#[0-9A-Fa-f]{6}$/ },
});

applyBaseSchema(projectSchema);

// Projects listed by tenant constantly
projectSchema.index({ tenantId: 1, isArchived: 1 });
projectSchema.index({ tenantId: 1, memberIds: 1 });

export const Project = model<IProject>('Project', projectSchema);
