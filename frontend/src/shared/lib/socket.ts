import { io, Socket } from 'socket.io-client';
import { config } from '@/shared/constants/config';

let socket: Socket | null = null;

export interface SocketEvents {
  'task:created': { taskId: string };
  'task:updated': { taskId: string };
  'task:deleted': { taskId: string };
  'task:assigned-to-you': { taskId: string; taskTitle: string };
  'task:completed': { taskId: string };
  'connect': void;
  'disconnect': void;
  'connect_error': Error;
}

export function initializeSocket(accessToken: string): Socket {
  if (socket?.connected) {
    return socket;
  }

  socket = io(config.wsUrl, {
    auth: { token: accessToken },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error.message);
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
