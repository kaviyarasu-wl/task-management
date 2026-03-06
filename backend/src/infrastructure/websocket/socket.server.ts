import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { JwtAccessPayload } from '@modules/auth/auth.types';
import { EventBus } from '@core/events/EventBus';
import { createLogger } from '@infrastructure/logger';
import { wsConnectionsActive } from '@infrastructure/metrics';

const log = createLogger('WebSocket');

let io: SocketServer | null = null;

/**
 * Socket auth middleware — JWT verification on connection handshake.
 * Unauthenticated connections are rejected before any room join.
 */
function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void): void {
  const token = socket.handshake.auth['token'] as string | undefined;

  if (!token) {
    next(new Error('Authentication required'));
    return;
  }

  try {
    const payload = jwt.verify(token, config.JWT_ACCESS_SECRET) as JwtAccessPayload;
    socket.data['user'] = payload;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
}

export function initSocketServer(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: config.NODE_ENV === 'production' ? false : '*',
      credentials: true,
    },
    // Redis adapter would be added here for horizontal scaling:
    // adapter: createAdapter(pubClient, subClient)
  });

  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    const user = socket.data['user'] as JwtAccessPayload;
    wsConnectionsActive.inc();

    // Each tenant has a room — all task updates go to tenant room
    void socket.join(`tenant:${user.tenantId}`);
    // Each user has a personal room for direct messages
    void socket.join(`user:${user.userId}`);

    log.info({ userId: user.userId, tenantId: user.tenantId }, 'User connected');

    socket.on('disconnect', () => {
      wsConnectionsActive.dec();
      log.info({ userId: user.userId }, 'User disconnected');
    });
  });

  // Bridge EventBus → WebSocket
  // When domain events fire, broadcast to connected clients
  EventBus.on('task.created', async ({ taskId, tenantId }) => {
    io?.to(`tenant:${tenantId}`).emit('task:created', { taskId });
  });

  EventBus.on('task.assigned', async ({ taskId, tenantId, assigneeId }) => {
    io?.to(`tenant:${tenantId}`).emit('task:updated', { taskId });
    io?.to(`user:${assigneeId}`).emit('task:assigned-to-you', { taskId });
  });

  EventBus.on('task.completed', async ({ taskId, tenantId }) => {
    io?.to(`tenant:${tenantId}`).emit('task:completed', { taskId });
  });

  EventBus.on('task.deleted', async ({ taskId, tenantId }) => {
    io?.to(`tenant:${tenantId}`).emit('task:deleted', { taskId });
  });

  // Status events — broadcast to all users in tenant when statuses change
  EventBus.on('status.created', async ({ statusId, tenantId }) => {
    io?.to(`tenant:${tenantId}`).emit('status:created', { statusId });
  });

  EventBus.on('status.updated', async ({ statusId, tenantId }) => {
    io?.to(`tenant:${tenantId}`).emit('status:updated', { statusId });
  });

  EventBus.on('status.deleted', async ({ statusId, tenantId }) => {
    io?.to(`tenant:${tenantId}`).emit('status:deleted', { statusId });
  });

  EventBus.on('status.reordered', async ({ tenantId, statusIds }) => {
    io?.to(`tenant:${tenantId}`).emit('status:reordered', { statusIds });
  });

  EventBus.on('status.defaultChanged', async ({ statusId, tenantId }) => {
    io?.to(`tenant:${tenantId}`).emit('status:default-changed', { statusId });
  });

  EventBus.on('status.transitionsUpdated', async ({ statusId, tenantId, allowedTransitions }) => {
    io?.to(`tenant:${tenantId}`).emit('status:transitions-updated', { statusId, allowedTransitions });
  });

  // Comment events — broadcast to users viewing the task
  // Notification events — push to individual user room
  EventBus.on('notification.created', async ({ notificationId, userId }) => {
    io?.to(`user:${userId}`).emit('notification:new', { notificationId });
  });

  EventBus.on('comment.created', async ({ commentId, taskId, tenantId, mentions }) => {
    io?.to(`tenant:${tenantId}`).emit('comment:created', { commentId, taskId });
    // Notify mentioned users directly
    for (const userId of mentions) {
      io?.to(`user:${userId}`).emit('comment:mentioned', { commentId, taskId });
    }
  });

  EventBus.on('comment.updated', async ({ commentId, taskId, tenantId }) => {
    io?.to(`tenant:${tenantId}`).emit('comment:updated', { commentId, taskId });
  });

  EventBus.on('comment.deleted', async ({ commentId, taskId, tenantId }) => {
    io?.to(`tenant:${tenantId}`).emit('comment:deleted', { commentId, taskId });
  });

  log.info('WebSocket server initialized');
  return io;
}

export function getSocketServer(): SocketServer {
  if (!io) throw new Error('Socket server not initialized');
  return io;
}
