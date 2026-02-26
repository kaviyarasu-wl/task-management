import { create } from 'zustand';
import type { Status, TransitionMatrix } from '../types/status.types';

interface StatusState {
  // Data
  statuses: Status[];
  transitionMatrix: TransitionMatrix;

  // Loading states
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  setStatuses: (statuses: Status[]) => void;
  setTransitionMatrix: (matrix: TransitionMatrix) => void;
  addStatus: (status: Status) => void;
  updateStatus: (status: Status) => void;
  removeStatus: (statusId: string) => void;
  reorderStatuses: (statuses: Status[]) => void;
  setLoading: (isLoading: boolean) => void;
  setInitialized: (isInitialized: boolean) => void;

  // Real-time handlers
  handleStatusCreated: (status: Status) => void;
  handleStatusUpdated: (status: Status) => void;
  handleStatusDeleted: (statusId: string) => void;
  handleStatusesReordered: (statuses: Status[]) => void;
  handleDefaultChanged: (statusId: string) => void;
  handleTransitionsUpdated: (statusId: string, transitions: string[]) => void;

  // Selectors (as actions for reusability)
  getStatusById: (id: string) => Status | undefined;
  getDefaultStatus: () => Status | undefined;
  getStatusesByCategory: (category: string) => Status[];
  getAvailableTransitions: (statusId: string) => Status[];
}

export const useStatusStore = create<StatusState>((set, get) => ({
  // Initial state
  statuses: [],
  transitionMatrix: {},
  isLoading: false,
  isInitialized: false,

  // Actions
  setStatuses: (statuses) =>
    set({ statuses: [...statuses].sort((a, b) => a.order - b.order), isInitialized: true }),

  setTransitionMatrix: (transitionMatrix) =>
    set({ transitionMatrix }),

  addStatus: (status) =>
    set((state) => ({
      statuses: [...state.statuses, status].sort((a, b) => a.order - b.order),
    })),

  updateStatus: (updatedStatus) =>
    set((state) => ({
      statuses: state.statuses
        .map((s) => (s._id === updatedStatus._id ? updatedStatus : s))
        .sort((a, b) => a.order - b.order),
    })),

  removeStatus: (statusId) =>
    set((state) => ({
      statuses: state.statuses.filter((s) => s._id !== statusId),
    })),

  reorderStatuses: (statuses) =>
    set({ statuses }),

  setLoading: (isLoading) =>
    set({ isLoading }),

  setInitialized: (isInitialized) =>
    set({ isInitialized }),

  // Real-time handlers (with deduplication and race condition handling)
  handleStatusCreated: (status) =>
    set((state) => {
      // Avoid duplicates (in case of race condition with optimistic updates)
      if (state.statuses.some((s) => s._id === status._id)) {
        return state;
      }
      return {
        statuses: [...state.statuses, status].sort((a, b) => a.order - b.order),
      };
    }),

  handleStatusUpdated: (updatedStatus) =>
    set((state) => ({
      statuses: state.statuses
        .map((s) => (s._id === updatedStatus._id ? updatedStatus : s))
        .sort((a, b) => a.order - b.order),
    })),

  handleStatusDeleted: (statusId) =>
    set((state) => ({
      statuses: state.statuses.filter((s) => s._id !== statusId),
    })),

  handleStatusesReordered: (statuses) =>
    set({ statuses }),

  handleDefaultChanged: (statusId) =>
    set((state) => ({
      statuses: state.statuses.map((s) => ({
        ...s,
        isDefault: s._id === statusId,
      })),
    })),

  handleTransitionsUpdated: (statusId, transitions) =>
    set((state) => ({
      statuses: state.statuses.map((s) =>
        s._id === statusId ? { ...s, allowedTransitions: transitions } : s
      ),
      transitionMatrix: {
        ...state.transitionMatrix,
        [statusId]: transitions,
      },
    })),

  // Selectors
  getStatusById: (id) =>
    get().statuses.find((s) => s._id === id),

  getDefaultStatus: () =>
    get().statuses.find((s) => s.isDefault) ?? get().statuses[0],

  getStatusesByCategory: (category) =>
    get().statuses.filter((s) => s.category === category),

  getAvailableTransitions: (statusId) => {
    const { transitionMatrix, statuses } = get();
    const allowedIds = transitionMatrix[statusId] ?? [];
    return statuses.filter((s) => allowedIds.includes(s._id));
  },
}));

// Convenience hooks for common selectors
export const useStatuses = () => useStatusStore((state) => state.statuses);
export const useStatusLoading = () => useStatusStore((state) => state.isLoading);
export const useStatusById = (id: string) =>
  useStatusStore((state) => state.statuses.find((s) => s._id === id));
export const useDefaultStatus = () =>
  useStatusStore((state) => state.statuses.find((s) => s.isDefault) ?? state.statuses[0]);
