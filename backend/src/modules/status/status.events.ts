/**
 * Status WebSocket Event Definitions
 *
 * These are the WebSocket event names emitted to connected clients.
 * The EventBus bridges domain events to WebSocket events via socket.server.ts.
 */

import type { IStatusDocument } from './status.model';

/**
 * WebSocket event names for status operations.
 * Format: 'status:<action>' for consistency with task events.
 */
export enum StatusEvent {
  CREATED = 'status:created',
  UPDATED = 'status:updated',
  DELETED = 'status:deleted',
  REORDERED = 'status:reordered',
  DEFAULT_CHANGED = 'status:default-changed',
  TRANSITIONS_UPDATED = 'status:transitions-updated',
}

/**
 * Payload types for each WebSocket event.
 * Used for type-safe event emission in socket.server.ts.
 */
export interface StatusEventPayloads {
  [StatusEvent.CREATED]: { statusId: string };
  [StatusEvent.UPDATED]: { statusId: string };
  [StatusEvent.DELETED]: { statusId: string };
  [StatusEvent.REORDERED]: { statusIds: string[] };
  [StatusEvent.DEFAULT_CHANGED]: { statusId: string };
  [StatusEvent.TRANSITIONS_UPDATED]: { statusId: string; allowedTransitions: string[] };
}

/**
 * Type helper for status document without Mongoose internals.
 * Useful for sending status data over WebSocket.
 */
export type StatusPayload = Pick<
  IStatusDocument,
  | 'name'
  | 'slug'
  | 'color'
  | 'icon'
  | 'category'
  | 'order'
  | 'isDefault'
> & {
  id: string;
  tenantId: string;
  allowedTransitions: string[];
};
