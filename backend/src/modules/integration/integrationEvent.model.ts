import { Schema, model, Types } from 'mongoose';
import { applyBaseSchema, BaseDocument } from '@infrastructure/database/mongodb/baseModel';

export type IntegrationEventDirection = 'inbound' | 'outbound';
export type IntegrationEventStatus = 'success' | 'failed';

export interface IIntegrationEvent extends BaseDocument {
  connectionId: Types.ObjectId;
  eventType: string;
  direction: IntegrationEventDirection;
  status: IntegrationEventStatus;
  payload?: Record<string, unknown>;
  responseCode?: number;
  errorMessage?: string;
}

const integrationEventSchema = new Schema<IIntegrationEvent>({
  connectionId: {
    type: Schema.Types.ObjectId,
    ref: 'Integration',
    required: true,
  },
  eventType: { type: String, required: true },
  direction: {
    type: String,
    enum: ['inbound', 'outbound'],
    required: true,
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    required: true,
  },
  payload: { type: Schema.Types.Mixed },
  responseCode: { type: Number },
  errorMessage: { type: String },
});

applyBaseSchema(integrationEventSchema);

integrationEventSchema.index({ connectionId: 1, createdAt: -1 });
integrationEventSchema.index({ tenantId: 1, createdAt: -1 });

export const IntegrationEvent = model<IIntegrationEvent>(
  'IntegrationEvent',
  integrationEventSchema
);
