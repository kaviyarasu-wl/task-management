import { Schema, model, Types } from 'mongoose';
import { applyBaseSchema, BaseDocument } from '@infrastructure/database/mongodb/baseModel';

export interface AuditChange {
  field: string;
  from: unknown;
  to: unknown;
}

export type AuditEntityType =
  | 'task'
  | 'project'
  | 'user'
  | 'role'
  | 'comment'
  | 'status'
  | 'invitation'
  | 'tenant'
  | 'webhook'
  | 'apiKey'
  | 'settings';

export interface IAuditLog extends BaseDocument {
  userId: Types.ObjectId;
  userEmail: string;
  action: string;
  entityType: AuditEntityType;
  entityId: string;
  changes: AuditChange[];
  ipAddress: string;
  userAgent: string;
  method: string;
  path: string;
  statusCode: number;
  metadata: Record<string, unknown>;
}

const auditChangeSchema = new Schema<AuditChange>(
  {
    field: { type: String, required: true },
    from: { type: Schema.Types.Mixed },
    to: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const auditLogSchema = new Schema<IAuditLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userEmail: { type: String, required: true },
  action: { type: String, required: true },
  entityType: {
    type: String,
    enum: [
      'task', 'project', 'user', 'role', 'comment', 'status',
      'invitation', 'tenant', 'webhook', 'apiKey', 'settings',
    ],
    required: true,
  },
  entityId: { type: String, required: true },
  changes: { type: [auditChangeSchema], default: [] },
  ipAddress: { type: String, default: 'unknown' },
  userAgent: { type: String, default: 'unknown' },
  method: { type: String, required: true },
  path: { type: String, required: true },
  statusCode: { type: Number, required: true },
  metadata: { type: Schema.Types.Mixed, default: {} },
});

applyBaseSchema(auditLogSchema);

// Primary query: recent audit logs for a tenant
auditLogSchema.index({ tenantId: 1, createdAt: -1 });
// Filter by actor
auditLogSchema.index({ tenantId: 1, userId: 1, createdAt: -1 });
// Filter by action type
auditLogSchema.index({ tenantId: 1, action: 1, createdAt: -1 });
// Entity history
auditLogSchema.index({ tenantId: 1, entityType: 1, entityId: 1, createdAt: -1 });
// Retention cleanup
auditLogSchema.index({ createdAt: 1 });

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);
