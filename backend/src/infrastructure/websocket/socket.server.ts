import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { JwtAccessPayload } from '@modules/auth/auth.types';
import { EventBus } from '@core/events/EventBus';

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

    // Each tenant has a room — all task updates go to tenant room
    void socket.join(`tenant:${user.tenantId}`);
    // Each user has a personal room for direct messages
    void socket.join(`user:${user.userId}`);

    console.log(`[WS] User ${user.userId} connected (tenant: ${user.tenantId})`);

    socket.on('disconnect', () => {
      console.log(`[WS] User ${user.userId} disconnected`);
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

  console.log('✅ WebSocket server initialized');
  return io;
}

export function getSocketServer(): SocketServer {
  if (!io) throw new Error('Socket server not initialized');
  return io;
}
