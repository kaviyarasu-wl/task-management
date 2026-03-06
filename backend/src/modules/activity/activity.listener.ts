import { EventBus, EventName, EventPayloads } from '@core/events/EventBus';
import { ActivityRepository } from './activity.repository';
import { ActivityEntityType } from './activity.model';
import { createLogger } from '@infrastructure/logger';

const log = createLogger('ActivityListener');

const activityRepo = new ActivityRepository();

/**
 * Maps event names to their entity type and entity ID field.
 * This allows generic activity logging for any domain event.
 */
interface EventMapping {
  entityType: ActivityEntityType;
  entityIdField: string;
  actorIdField: string;
}

const eventEntityMap: Partial<Record<EventName, EventMapping>> = {
  // Task events
  'task.created': { entityType: 'task', entityIdField: 'taskId', actorIdField: 'createdBy' },
  'task.updated': { entityType: 'task', entityIdField: 'taskId', actorIdField: 'updatedBy' },
  'task.assigned': { entityType: 'task', entityIdField: 'taskId', actorIdField: 'assignedBy' },
  'task.completed': { entityType: 'task', entityIdField: 'taskId', actorIdField: 'completedBy' },
  'task.deleted': { entityType: 'task', entityIdField: 'taskId', actorIdField: 'deletedBy' },

  // Comment events
  'comment.created': { entityType: 'comment', entityIdField: 'commentId', actorIdField: 'authorId' },
  'comment.updated': { entityType: 'comment', entityIdField: 'commentId', actorIdField: 'authorId' },
  'comment.deleted': { entityType: 'comment', entityIdField: 'commentId', actorIdField: 'deletedBy' },

  // Project events
  'project.created': { entityType: 'project', entityIdField: 'projectId', actorIdField: 'createdBy' },
  'project.updated': { entityType: 'project', entityIdField: 'projectId', actorIdField: 'updatedBy' },
  'project.deleted': { entityType: 'project', entityIdField: 'projectId', actorIdField: 'deletedBy' },

  // Status events
  'status.created': { entityType: 'status', entityIdField: 'statusId', actorIdField: 'statusId' },
  'status.updated': { entityType: 'status', entityIdField: 'statusId', actorIdField: 'statusId' },
  'status.deleted': { entityType: 'status', entityIdField: 'statusId', actorIdField: 'statusId' },

  // User/invitation events
  'user.invited': { entityType: 'user', entityIdField: 'userId', actorIdField: 'invitedBy' },
  'user.removed': { entityType: 'user', entityIdField: 'userId', actorIdField: 'removedBy' },
  'invitation.created': { entityType: 'invitation', entityIdField: 'invitationId', actorIdField: 'invitedBy' },
  'invitation.accepted': { entityType: 'invitation', entityIdField: 'invitationId', actorIdField: 'userId' },
  'invitation.cancelled': { entityType: 'invitation', entityIdField: 'invitationId', actorIdField: 'invitationId' },

  // Tenant events
  'tenant.created': { entityType: 'tenant', entityIdField: 'tenantId', actorIdField: 'ownerId' },
};

/**
 * Generic event handler that logs any mapped event to the activity feed.
 */
async function handleEvent<T extends EventName>(
  eventName: T,
  payload: EventPayloads[T]
): Promise<void> {
  const mapping = eventEntityMap[eventName];
  if (!mapping) {
    log.warn({ eventName }, 'No mapping for event');
    return;
  }

  const entityId = (payload as Record<string, unknown>)[mapping.entityIdField] as string;
  const actorId = (payload as Record<string, unknown>)[mapping.actorIdField] as string;
  const tenantId = (payload as Record<string, unknown>)['tenantId'] as string;

  if (!entityId || !actorId || !tenantId) {
    log.warn({ eventName, entityId, actorId, tenantId }, 'Missing required fields for event');
    return;
  }

  try {
    await activityRepo.create({
      tenantId,
      entityType: mapping.entityType,
      entityId,
      action: eventName,
      actorId,
      metadata: payload as Record<string, unknown>,
      occurredAt: new Date(),
    });
  } catch (err) {
    log.error({ err, eventName }, 'Failed to log activity');
  }
}

/**
 * Register all activity listeners. Call this during server startup.
 */
export function registerActivityListeners(): void {
  // Subscribe to all mapped events
  const eventNames = Object.keys(eventEntityMap) as EventName[];

  for (const eventName of eventNames) {
    EventBus.on(eventName, async (payload) => {
      await handleEvent(eventName, payload);
    });
  }

  log.info({ eventCount: eventNames.length }, 'Activity listeners registered');
}
