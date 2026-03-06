import { Schema, model, Types } from 'mongoose';
import {
  applyBaseSchema,
  BaseDocument,
} from '@infrastructure/database/mongodb/baseModel';

export interface IRole extends BaseDocument {
  name: string;
  slug: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  createdBy?: Types.ObjectId;
}

const roleSchema = new Schema<IRole>({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  slug: { type: String, required: true, lowercase: true, trim: true },
  description: { type: String, maxlength: 500 },
  permissions: { type: [String], required: true, default: [] },
  isSystem: { type: Boolean, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
});

applyBaseSchema(roleSchema);

// Unique role slug per tenant
roleSchema.index({ tenantId: 1, slug: 1 }, { unique: true });
// Filter system vs custom roles
roleSchema.index({ tenantId: 1, isSystem: 1 });

export const Role = model<IRole>('Role', roleSchema);
