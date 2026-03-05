import { EventEmitter } from 'events';

// All event payloads are defined here — the single source of truth
export interface EventPayloads {
  'task.created': { taskId: string; tenantId: string; assigneeId?: string; createdBy: string };
  'task.assigned': { taskId: string; tenantId: string; assigneeId: string; assignedBy: string };
  'task.completed': { taskId: string; tenantId: string; completedBy: string };
  'task.deleted': { taskId: string; tenantId: string; deletedBy: string };
  'task.updated': { taskId: string; tenantId: string; updatedBy: string };
  'user.invited': { userId: string; tenantId: string; email: string; role: string; invitedBy: string };
  'user.removed': { userId: string; tenantId: string; removedBy: string };
  'tenant.created': { tenantId: string; ownerId: string; plan: string };
  'status.created': { statusId: string; tenantId: string };
  'status.updated': { statusId: string; tenantId: string };
  'status.deleted': { statusId: string; tenantId: string };
  'status.reordered': { tenantId: string; statusIds: string[] };
  'status.defaultChanged': { statusId: string; tenantId: string };
  'status.transitionsUpdated': { statusId: string; tenantId: string; allowedTransitions: string[] };
  'invitation.created': { invitationId: string; tenantId: string; email: string; role: string; invitedBy: string; token: string };
  'invitation.accepted': { invitationId: string; tenantId: string; userId: string; email: string };
  'invitation.cancelled': { invitationId: string; tenantId: string; email: string };
  'comment.created': { commentId: string; taskId: string; tenantId: string; authorId: string; mentions: string[] };
  'comment.updated': { commentId: string; taskId: string; tenantId: string; authorId: string };
  'comment.deleted': { commentId: string; taskId: string; tenantId: string; deletedBy: string };
  'project.created': { projectId: string; tenantId: string; createdBy: string };
  'project.updated': { projectId: string; tenantId: string; updatedBy: string };
  'project.deleted': { projectId: string; tenantId: string; deletedBy: string };
  // Time tracking events
  'timer.started': { entryId: string; taskId: string; tenantId: string; userId: string };
  'timer.stopped': { entryId: string; taskId: string; tenantId: string; durationMinutes: number };
  'timeEntry.created': { entryId: string; taskId: string; tenantId: string; userId: string; durationMinutes: number };
  'timeEntry.updated': { entryId: string; taskId: string; tenantId: string; userId: string };
  'timeEntry.deleted': { entryId: string; taskId: string; tenantId: string; deletedBy: string };
  // Recurrence events
  'recurrence.created': { recurrenceId: string; taskId: string; tenantId: string; createdBy: string };
  'recurrence.updated': { recurrenceId: string; tenantId: string; updatedBy: string };
  'recurrence.deleted': { recurrenceId: string; taskId: string; tenantId: string; deletedBy: string };
  'recurrence.deactivated': { recurrenceId: string; tenantId: string; deactivatedBy: string };
  'recurrence.taskGenerated': { taskId: string; recurrenceId: string; tenantId: string; occurrenceNumber: number };
  // Webhook events
  'webhook.delivered': { webhookId: string; deliveryId: string; tenantId: string };
  'webhook.failed': { webhookId: string; deliveryId: string; tenantId: string; reason: string };
  // Admin events
  'admin.plan.created': { planId: string };
  'admin.plan.updated': { planId: string };
  'admin.plan.deleted': { planId: string };
  'admin.tenant.planChanged': { tenantId: string; oldPlanId: string; newPlanId: string };
  'admin.tenant.suspended': { tenantId: string; reason: string };
  'admin.tenant.activated': { tenantId: string };
  'admin.user.moved': { userId: string; oldTenantId: string; newTenantId: string };
  'admin.user.deleted': { userId: string; email: string };
}

export type EventName = keyof EventPayloads;

type EventListener<T extends EventName> = (payload: EventPayloads[T]) => Promise<void> | void;

class TypedEventBus {
  private emitter = new EventEmitter();

  constructor() {
    // Increase max listeners to avoid Node.js warnings in large apps
    this.emitter.setMaxListeners(50);
  }

  on<T extends EventName>(event: T, listener: EventListener<T>): void {
    // Wrap every listener in try/catch — one bad listener must not crash the emitter
    const safeListener = async (payload: EventPayloads[T]) => {
      try {
        await listener(payload);
      } catch (err) {
        console.error(`[EventBus] Error in listener for "${event}":`, err);
      }
    };
    this.emitter.on(event, safeListener);
  }

  async emit<T extends EventName>(event: T, payload: EventPayloads[T]): Promise<void> {
    const listeners = this.emitter.listeners(event) as Array<(p: EventPayloads[T]) => Promise<void>>;
    // Run all listeners concurrently — await all before returning
    await Promise.all(listeners.map((listener) => listener(payload)));
  }

  off<T extends EventName>(event: T, listener: EventListener<T>): void {
    this.emitter.off(event, listener);
  }
}

// Singleton — one EventBus for the entire app
export const EventBus = new TypedEventBus();
