import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/shared/contexts/SocketContext';
import { useStatusStore } from '../stores/statusStore';
import { statusKeys } from './useStatuses';
import type { Status } from '../types/status.types';

// Event names matching backend
const StatusEvent = {
  CREATED: 'status:created',
  UPDATED: 'status:updated',
  DELETED: 'status:deleted',
  REORDERED: 'status:reordered',
  DEFAULT_CHANGED: 'status:default-changed',
  TRANSITIONS_UPDATED: 'status:transitions-updated',
} as const;

// Event payload types
interface StatusCreatedPayload {
  status: Status;
}

interface StatusUpdatedPayload {
  status: Status;
}

interface StatusDeletedPayload {
  statusId: string;
}

interface StatusReorderedPayload {
  statuses: Status[];
}

interface DefaultChangedPayload {
  statusId: string;
}

interface TransitionsUpdatedPayload {
  statusId: string;
  transitions: string[];
}

export function useStatusRealtime() {
  const { on, off, isConnected } = useSocket();
  const queryClient = useQueryClient();

  const {
    handleStatusCreated,
    handleStatusUpdated,
    handleStatusDeleted,
    handleStatusesReordered,
    handleDefaultChanged,
    handleTransitionsUpdated,
    getStatusById,
  } = useStatusStore();

  useEffect(() => {
    if (!isConnected) return;

    const onCreated = (payload: StatusCreatedPayload) => {
      console.log('[Status] Created:', payload.status.name);
      handleStatusCreated(payload.status);
      // Invalidate list query for components using React Query directly
      queryClient.invalidateQueries({ queryKey: statusKeys.list() });
    };

    const onUpdated = (payload: StatusUpdatedPayload) => {
      console.log('[Status] Updated:', payload.status.name);
      handleStatusUpdated(payload.status);
      queryClient.invalidateQueries({
        queryKey: statusKeys.detail(payload.status._id),
      });
    };

    const onDeleted = (payload: StatusDeletedPayload) => {
      const status = getStatusById(payload.statusId);
      console.log('[Status] Deleted:', status?.name ?? payload.statusId);
      handleStatusDeleted(payload.statusId);
      queryClient.invalidateQueries({ queryKey: statusKeys.list() });
    };

    const onReordered = (payload: StatusReorderedPayload) => {
      console.log('[Status] Reordered');
      handleStatusesReordered(payload.statuses);
      queryClient.invalidateQueries({ queryKey: statusKeys.list() });
    };

    const onDefaultChanged = (payload: DefaultChangedPayload) => {
      console.log('[Status] Default changed:', payload.statusId);
      handleDefaultChanged(payload.statusId);
      queryClient.invalidateQueries({ queryKey: statusKeys.default() });
    };

    const onTransitionsUpdated = (payload: TransitionsUpdatedPayload) => {
      console.log('[Status] Transitions updated:', payload.statusId);
      handleTransitionsUpdated(payload.statusId, payload.transitions);
      queryClient.invalidateQueries({ queryKey: statusKeys.matrix() });
      queryClient.invalidateQueries({
        queryKey: statusKeys.transitions(payload.statusId),
      });
    };

    // Subscribe to events
    on(StatusEvent.CREATED, onCreated);
    on(StatusEvent.UPDATED, onUpdated);
    on(StatusEvent.DELETED, onDeleted);
    on(StatusEvent.REORDERED, onReordered);
    on(StatusEvent.DEFAULT_CHANGED, onDefaultChanged);
    on(StatusEvent.TRANSITIONS_UPDATED, onTransitionsUpdated);

    // Cleanup on unmount
    return () => {
      off(StatusEvent.CREATED, onCreated);
      off(StatusEvent.UPDATED, onUpdated);
      off(StatusEvent.DELETED, onDeleted);
      off(StatusEvent.REORDERED, onReordered);
      off(StatusEvent.DEFAULT_CHANGED, onDefaultChanged);
      off(StatusEvent.TRANSITIONS_UPDATED, onTransitionsUpdated);
    };
  }, [
    isConnected,
    on,
    off,
    queryClient,
    handleStatusCreated,
    handleStatusUpdated,
    handleStatusDeleted,
    handleStatusesReordered,
    handleDefaultChanged,
    handleTransitionsUpdated,
    getStatusById,
  ]);
}
