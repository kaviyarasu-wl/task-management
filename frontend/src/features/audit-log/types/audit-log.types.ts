export type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'invite' | 'role_change';

export type AuditEntityType =
  | 'task'
  | 'project'
  | 'user'
  | 'tenant'
  | 'status'
  | 'webhook'
  | 'comment';

export interface FieldChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface AuditLogEntry {
  _id: string;
  tenantId: string;
  userId: string;
  userEmail: string;
  userName: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  entityName?: string;
  changes: FieldChange[];
  metadata: Record<string, unknown>;
  ipAddress: string;
  userAgent?: string;
  createdAt: string;
}

export interface AuditLogFilterParams {
  userId?: string;
  action?: AuditAction;
  entityType?: AuditEntityType;
  startDate?: string;
  endDate?: string;
  cursor?: string;
  limit?: number;
}

export const AUDIT_ACTION_OPTIONS: Array<{ value: AuditAction; label: string }> = [
  { value: 'create', label: 'Created' },
  { value: 'update', label: 'Updated' },
  { value: 'delete', label: 'Deleted' },
  { value: 'login', label: 'Logged In' },
  { value: 'logout', label: 'Logged Out' },
  { value: 'invite', label: 'Invited' },
  { value: 'role_change', label: 'Role Changed' },
];

export const AUDIT_ENTITY_OPTIONS: Array<{ value: AuditEntityType; label: string }> = [
  { value: 'task', label: 'Task' },
  { value: 'project', label: 'Project' },
  { value: 'user', label: 'User' },
  { value: 'tenant', label: 'Organization' },
  { value: 'status', label: 'Status' },
  { value: 'webhook', label: 'Webhook' },
  { value: 'comment', label: 'Comment' },
];
