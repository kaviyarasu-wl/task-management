import { Schema, model, Types } from 'mongoose';
import { applyBaseSchema, BaseDocument } from '@infrastructure/database/mongodb/baseModel';
import { TenantPlan } from '../../types';
import type { IPlan } from '../admin/models/plan.model';

export interface ITenant extends BaseDocument {
  name: string;
  slug: string; // URL-safe identifier, unique
  plan: TenantPlan;           // Legacy field - kept for backward compatibility
  planId?: Types.ObjectId;    // NEW: ObjectId reference to Plan collection
  ownerId: string;
  settings: {
    maxUsers: number;
    maxProjects: number;
    allowedPlugins: string[];
  };
  isActive: boolean;
  suspendedAt?: Date;         // Track when tenant was suspended
  suspendedReason?: string;   // Admin notes for suspension
}

// Interface with populated plan for API responses
export interface ITenantWithPlan extends Omit<ITenant, 'planId'> {
  planId?: Types.ObjectId;
  planDetails?: IPlan;
}

const tenantSchema = new Schema<ITenant>({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
  planId: { type: Schema.Types.ObjectId, ref: 'Plan' },
  ownerId: { type: String, required: true },
  settings: {
    maxUsers: { type: Number, default: 5 },
    maxProjects: { type: Number, default: 3 },
    allowedPlugins: { type: [String], default: [] },
  },
  isActive: { type: Boolean, default: true },
  suspendedAt: { type: Date },
  suspendedReason: { type: String, maxlength: 500 },
});

applyBaseSchema(tenantSchema);

// Virtual for populated plan details
tenantSchema.virtual('planDetails', {
  ref: 'Plan',
  localField: 'planId',
  foreignField: '_id',
  justOne: true,
});

// Ensure virtuals are included in JSON/Object output
tenantSchema.set('toJSON', { virtuals: true });
tenantSchema.set('toObject', { virtuals: true });

// Tenants query by slug frequently (login flow)
tenantSchema.index({ slug: 1 });
tenantSchema.index({ ownerId: 1 });
tenantSchema.index({ planId: 1 });

export const Tenant = model<ITenant>('Tenant', tenantSchema);
