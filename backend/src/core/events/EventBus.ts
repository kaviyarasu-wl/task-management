import { EventEmitter } from 'events';

// All event payloads are defined here — the single source of truth
export interface EventPayloads {
  'task.created': { taskId: string; tenantId: string; assigneeId?: string; createdBy: string };
  'task.assigned': { taskId: string; tenantId: string; assigneeId: string; assignedBy: string };
  'task.completed': { taskId: string; tenantId: string; completedBy: string };
  'task.deleted': { taskId: string; tenantId: string; deletedBy: string };
  'user.invited': { userId: string; tenantId: string; email: string; role: string; invitedBy: string };
  'user.removed': { userId: string; tenantId: string; removedBy: string };
  'tenant.created': { tenantId: string; ownerId: string; plan: string };
  'status.created': { statusId: string; tenantId: string };
  'status.updated': { statusId: string; tenantId: string };
  'status.deleted': { statusId: string; tenantId: string };
  'status.reordered': { tenantId: string; statusIds: string[] };
  'status.defaultChanged': { statusId: string; tenantId: string };
  'status.transitionsUpdated': { statusId: string; tenantId: string; allowedTransitions: string[] };
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
