import { Schema, model } from 'mongoose';
import { applyBaseSchema, BaseDocument } from '@infrastructure/database/mongodb/baseModel';
import { TenantPlan } from '../../types';

export interface ITenant extends BaseDocument {
  name: string;
  slug: string; // URL-safe identifier, unique
  plan: TenantPlan;
  ownerId: string;
  settings: {
    maxUsers: number;
    maxProjects: number;
    allowedPlugins: string[];
  };
  isActive: boolean;
}

const tenantSchema = new Schema<ITenant>({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
  ownerId: { type: String, required: true },
  settings: {
    maxUsers: { type: Number, default: 5 },
    maxProjects: { type: Number, default: 3 },
    allowedPlugins: { type: [String], default: [] },
  },
  isActive: { type: Boolean, default: true },
});

applyBaseSchema(tenantSchema);

// Tenants query by slug frequently (login flow)
tenantSchema.index({ slug: 1 });
tenantSchema.index({ ownerId: 1 });

export const Tenant = model<ITenant>('Tenant', tenantSchema);
