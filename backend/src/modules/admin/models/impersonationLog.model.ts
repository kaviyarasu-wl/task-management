import { Schema, model, Document, Types } from 'mongoose';

export interface ImpersonationAction {
  timestamp: Date;
  action: string;
  details?: Record<string, unknown>;
}

export interface IImpersonationLog extends Document {
  _id: Types.ObjectId;
  superAdminId: string;
  superAdminEmail: string;
  tenantId: string;
  tenantName: string;
  reason: string;
  startedAt: Date;
  endedAt?: Date;
  actions: ImpersonationAction[];
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const impersonationLogSchema = new Schema<IImpersonationLog>(
  {
    superAdminId: {
      type: String,
      required: true,
      index: true,
    },
    superAdminEmail: {
      type: String,
      required: true,
    },
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    tenantName: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      maxlength: 500,
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endedAt: {
      type: Date,
    },
    actions: [
      {
        timestamp: { type: Date, default: Date.now },
        action: { type: String, required: true },
        details: { type: Schema.Types.Mixed },
      },
    ],
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  {
    timestamps: true,
  }
);

// Indexes for querying
impersonationLogSchema.index({ startedAt: -1 });
impersonationLogSchema.index({ superAdminId: 1, startedAt: -1 });
impersonationLogSchema.index({ tenantId: 1, startedAt: -1 });
// Index for finding active sessions
impersonationLogSchema.index({ superAdminId: 1, endedAt: 1 });

export const ImpersonationLog = model<IImpersonationLog>(
  'ImpersonationLog',
  impersonationLogSchema
);
