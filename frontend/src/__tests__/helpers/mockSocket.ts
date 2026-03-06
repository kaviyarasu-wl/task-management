import { vi } from 'vitest';

/**
 * Creates a mock Socket.io client for testing real-time hooks
 */
export function createMockSocket() {
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>();

  const socket = {
    connected: true,
    id: 'mock-socket-id',

    on: vi.fn((event: string, callback: (...args: unknown[]) => void) => {
      if (!listeners.has(event)) {
        listeners.set(event, new Set());
      }
      listeners.get(event)!.add(callback);
      return socket;
    }),

    off: vi.fn((event: string, callback?: (...args: unknown[]) => void) => {
      if (callback) {
        listeners.get(event)?.delete(callback);
      } else {
        listeners.delete(event);
      }
      return socket;
    }),

    emit: vi.fn(),

    connect: vi.fn(() => {
      socket.connected = true;
      return socket;
    }),

    disconnect: vi.fn(() => {
      socket.connected = false;
      return socket;
    }),

    // Helper to simulate server events in tests
    __simulateEvent: (event: string, ...args: unknown[]) => {
      listeners.get(event)?.forEach((callback) => callback(...args));
    },

    __getListenerCount: (event: string) => {
      return listeners.get(event)?.size ?? 0;
    },

    __clearListeners: () => {
      listeners.clear();
    },
  };

  return socket;
}
