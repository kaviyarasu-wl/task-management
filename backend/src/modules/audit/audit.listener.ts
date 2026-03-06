import { EventBus, EventName } from '@core/events/EventBus';
import { AuditLogService } from './audit.service';
import { AuditEntityType } from './audit.model';

const auditService = new AuditLogService();

/**
 * Maps domain events to audit log entries.
 * The audit middleware handles HTTP-level logging; this listener
 * supplements it with event-level context when events carry extra data
 * (e.g., the EventBus emits events from background jobs or WebSocket handlers
 * that bypass HTTP middleware).
 */

interface AuditEventMapping {
  entityType: AuditEntityType;
  entityIdField: string;
  actorIdField: string;
}

const EVENT_AUDIT_MAP: Partial<Record<EventName, AuditEventMapping>> = {
  'task.created': { entityType: 'task', entityIdField: 'taskId', actorIdField: 'createdBy' },
  'task.updated': { entityType: 'task', entityIdField: 'taskId', actorIdField: 'updatedBy' },
  'task.deleted': { entityType: 'task', entityIdField: 'taskId', actorIdField: 'deletedBy' },
  'task.assigned': { entityType: 'task', entityIdField: 'taskId', actorIdField: 'assignedBy' },
  'task.completed': { entityType: 'task', entityIdField: 'taskId', actorIdField: 'completedBy' },
  'project.created': { entityType: 'project', entityIdField: 'projectId', actorIdField: 'createdBy' },
  'project.updated': { entityType: 'project', entityIdField: 'projectId', actorIdField: 'updatedBy' },
  'project.deleted': { entityType: 'project', entityIdField: 'projectId', actorIdField: 'deletedBy' },
  'user.invited': { entityType: 'user', entityIdField: 'userId', actorIdField: 'invitedBy' },
  'user.removed': { entityType: 'user', entityIdField: 'userId', actorIdField: 'removedBy' },
  'role.created': { entityType: 'role', entityIdField: 'roleId', actorIdField: 'createdBy' },
  'comment.created': { entityType: 'comment', entityIdField: 'commentId', actorIdField: 'authorId' },
  'comment.deleted': { entityType: 'comment', entityIdField: 'commentId', actorIdField: 'deletedBy' },
  'status.created': { entityType: 'status', entityIdField: 'statusId', actorIdField: 'statusId' },
  'status.updated': { entityType: 'status', entityIdField: 'statusId', actorIdField: 'statusId' },
  'status.deleted': { entityType: 'status', entityIdField: 'statusId', actorIdField: 'statusId' },
};

/**
 * Register audit log listeners on the EventBus.
 * These create audit entries for domain events that may not pass through HTTP middleware.
 */
export function registerAuditListeners(): void {
  const eventNames = Object.keys(EVENT_AUDIT_MAP) as EventName[];

  for (const eventName of eventNames) {
    EventBus.on(eventName, async (payload) => {
      const mapping = EVENT_AUDIT_MAP[eventName];
      if (!mapping) return;

      const record = payload as Record<string, unknown>;
      const entityId = String(record[mapping.entityIdField] ?? 'unknown');
      const actorId = String(record[mapping.actorIdField] ?? 'unknown');
      const tenantId = String(record['tenantId'] ?? '');

      if (!tenantId) return;

      await auditService.logAction({
        tenantId,
        userId: actorId,
        userEmail: String(record['email'] ?? 'system'),
        action: eventName,
        entityType: mapping.entityType,
        entityId,
        ipAddress: 'event-bus',
        userAgent: 'system',
        method: 'EVENT',
        path: `event://${eventName}`,
        statusCode: 0,
        metadata: record,
      });
    });
  }
}
