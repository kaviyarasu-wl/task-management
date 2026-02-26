import 'dotenv/config';
import { createApp } from './app';
import { config } from './config';
import { connectMongoDB, disconnectMongoDB } from '@infrastructure/database/mongodb/client';
import { getRedisClient, disconnectRedis } from '@infrastructure/redis/client';
import { initSocketServer } from '@infrastructure/websocket/socket.server';
import { registerNotificationListeners } from './modules/notification/notification.listener';
import { registerUserListeners } from './modules/user/listeners/user.listener';
import { createEmailWorker } from '@infrastructure/queue/workers/email.worker';
import { createReminderWorker } from '@infrastructure/queue/workers/reminder.worker';
import { emailProcessor } from '@infrastructure/queue/processors/email.processor';
import { reminderProcessor } from '@infrastructure/queue/processors/reminder.processor';
import http from 'http';

async function start(): Promise<void> {
  // 1. Connect infrastructure
  await connectMongoDB();
  getRedisClient();

  // 2. Register all domain event listeners before routes can fire events
  registerNotificationListeners();
  registerUserListeners();

  // 3. Start background workers with injected processors (infra stays dumb)
  createEmailWorker(emailProcessor);
  createReminderWorker(reminderProcessor);

  // 4. Create Express app
  const app = await createApp();
  const server = http.createServer(app);

  // 5. Initialize WebSocket — bridges EventBus to connected clients
  initSocketServer(server);

  // 6. Start listening
  server.listen(config.PORT, () => {
    console.log(`🚀 Server running on port ${config.PORT} [${config.NODE_ENV}]`);
    console.log(`   Health: http://localhost:${config.PORT}/health`);
  });

  // 7. Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n${signal} received. Shutting down gracefully...`);

    server.close(async () => {
      console.log('HTTP server closed');
      try {
        await disconnectMongoDB();
        await disconnectRedis();
        console.log('✅ Graceful shutdown complete');
        process.exit(0);
      } catch (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
      }
    });

    // Force exit after 10s if graceful shutdown hangs
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Promise Rejection:', reason);
    if (config.NODE_ENV === 'production') process.exit(1);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
