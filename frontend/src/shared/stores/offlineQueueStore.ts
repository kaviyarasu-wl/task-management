import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface QueuedMutation {
  id: string;
  type: 'create_task' | 'update_task';
  payload: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
}

interface OfflineQueueState {
  queue: QueuedMutation[];
  addToQueue: (mutation: Omit<QueuedMutation, 'id' | 'timestamp' | 'retryCount'>) => void;
  removeFromQueue: (id: string) => void;
  incrementRetry: (id: string) => void;
  clearQueue: () => void;
  getQueueSize: () => number;
}

function createIndexedDBStorage() {
  const DB_NAME = 'taskflow-offline';
  const STORE_NAME = 'queue';

  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore(STORE_NAME);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  return {
    getItem: async (name: string): Promise<string | null> => {
      try {
        const db = await openDB();
        return new Promise((resolve) => {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const request = store.get(name);
          request.onsuccess = () => resolve(request.result ?? null);
          request.onerror = () => resolve(null);
        });
      } catch {
        return null;
      }
    },
    setItem: async (name: string, value: string): Promise<void> => {
      try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(value, name);
      } catch {
        // Fail silently - offline queue is best-effort
      }
    },
    removeItem: async (name: string): Promise<void> => {
      try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(name);
      } catch {
        // Fail silently
      }
    },
  };
}

export const useOfflineQueueStore = create<OfflineQueueState>()(
  persist(
    (set, get) => ({
      queue: [],

      addToQueue: (mutation) => {
        const entry: QueuedMutation = {
          ...mutation,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          retryCount: 0,
        };
        set((state) => ({ queue: [...state.queue, entry] }));
      },

      removeFromQueue: (id) => {
        set((state) => ({
          queue: state.queue.filter((m) => m.id !== id),
        }));
      },

      incrementRetry: (id) => {
        set((state) => ({
          queue: state.queue.map((m) =>
            m.id === id ? { ...m, retryCount: m.retryCount + 1 } : m
          ),
        }));
      },

      clearQueue: () => set({ queue: [] }),

      getQueueSize: () => get().queue.length,
    }),
    {
      name: 'offline-queue',
      storage: createJSONStorage(() => createIndexedDBStorage()),
    }
  )
);
