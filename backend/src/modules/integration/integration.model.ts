import { Schema, model, Types } from 'mongoose';
import { applyBaseSchema, BaseDocument } from '@infrastructure/database/mongodb/baseModel';

export type IntegrationProvider = 'slack' | 'github' | 'jira' | 'linear' | 'discord' | 'google_calendar';
export type IntegrationStatus = 'active' | 'inactive' | 'error' | 'pending';

export interface IIntegration extends BaseDocument {
  provider: IntegrationProvider;
  name: string;
  config: string; // AES-256-GCM encrypted JSON blob
  status: IntegrationStatus;
  webhookSecret: string;
  lastSyncAt?: Date;
  lastError?: string;
  enabledEvents: string[];
  createdBy: Types.ObjectId;
}

const integrationSchema = new Schema<IIntegration>({
  provider: {
    type: String,
    enum: ['slack', 'github', 'jira', 'linear', 'discord', 'google_calendar'],
    required: true,
  },
  name: { type: String, required: true, trim: true },
  config: { type: String, required: true },
  status: {
    type: String,
    enum: ['active', 'inactive', 'error', 'pending'],
    default: 'active',
  },
  webhookSecret: { type: String, required: true },
  lastSyncAt: { type: Date },
  lastError: { type: String },
  enabledEvents: { type: [String], default: [] },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

applyBaseSchema(integrationSchema);

integrationSchema.index({ tenantId: 1, provider: 1 });
integrationSchema.index({ tenantId: 1, status: 1 });
integrationSchema.index({ webhookSecret: 1 }, { unique: true });

export const Integration = model<IIntegration>('Integration', integrationSchema);
