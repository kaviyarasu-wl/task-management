import 'dotenv/config';
import { initSentry } from '@infrastructure/sentry';
import { createApp } from './app';
import { config } from './config';
import { logger } from '@infrastructure/logger';
import { connectMongoDB, disconnectMongoDB } from '@infrastructure/database/mongodb/client';
import { getRedisClient, disconnectRedis } from '@infrastructure/redis/client';
import { initSocketServer } from '@infrastructure/websocket/socket.server';
import { registerNotificationListeners } from './modules/notification/notification.listener';
import { registerUserListeners } from './modules/user/listeners/user.listener';
import { registerTenantListeners } from './modules/tenant/listeners/tenant.listener';
import { registerActivityListeners } from './modules/activity/activity.listener';
import { registerWebhookListeners } from './modules/webhook/webhook.listener';
import { registerSearchIndexListeners } from './modules/search/search.indexer';
import { registerRoleSeederListeners } from './modules/role/role.seeder';
import { createEmailWorker } from '@infrastructure/queue/workers/email.worker';
import { createReminderWorker } from '@infrastructure/queue/workers/reminder.worker';
import { createRecurrenceWorker } from '@infrastructure/queue/workers/recurrence.worker';
import { createDigestWorker } from '@infrastructure/queue/workers/digest.worker';
import { createScheduledReportWorker } from '@infrastructure/queue/workers/scheduledReport.worker';
import { createWebhookWorker } from '@infrastructure/queue/workers/webhook.worker';
import { emailProcessor } from '@infrastructure/queue/processors/email.processor';
import { reminderProcessor } from '@infrastructure/queue/processors/reminder.processor';
import { recurrenceProcessor } from '@infrastructure/queue/processors/recurrence.processor';
import { digestProcessor } from '@infrastructure/queue/processors/digest.processor';
import { scheduledReportProcessor } from '@infrastructure/queue/processors/scheduledReport.processor';
import { webhookProcessor } from '@infrastructure/queue/processors/webhook.processor';
import { recurrenceQueue, reminderQueue, digestQueue, scheduledReportQueue, auditCleanupQueue } from '@infrastructure/queue/queues';
import { registerAuditListeners } from './modules/audit/audit.listener';
import { registerIntegrationListeners } from './modules/integration/integration.listener';
import { createExportWorker } from '@infrastructure/queue/workers/export.worker';
import { exportProcessor } from '@infrastructure/queue/processors/export.processor';
import { createAuditCleanupWorker } from '@infrastructure/queue/workers/auditCleanup.worker';
import { auditCleanupProcessor } from '@infrastructure/queue/processors/auditCleanup.processor';
import { createIntegrationWorker } from '@infrastructure/queue/workers/integration.worker';
import { integrationProcessor } from '@infrastructure/queue/processors/integration.processor';
import { loadTranslations } from '@infrastructure/i18n';
import http from 'http';
import { appStartupDuration } from '@infrastructure/metrics';

async function start(): Promise<void> {
  const startupStart = process.hrtime.bigint();

  // 0. Initialize Sentry first — captures errors from all subsequent setup
  initSentry();

  // 1. Connect infrastructure
  await connectMongoDB();
  getRedisClient();

  // 1.5. Load i18n translations before anything can use t()
  loadTranslations();

  // 2. Register all domain event listeners before routes can fire events
  registerNotificationListeners();
  registerUserListeners();
  registerTenantListeners();
  registerActivityListeners();
  registerWebhookListeners();
  registerSearchIndexListeners();
  registerRoleSeederListeners();
  registerAuditListeners();
  registerIntegrationListeners();

  // 3. Start background workers with injected processors (infra stays dumb)
  createEmailWorker(emailProcessor);
  createReminderWorker(reminderProcessor);
  createRecurrenceWorker(recurrenceProcessor);
  createDigestWorker(digestProcessor);
  createScheduledReportWorker(scheduledReportProcessor);
  createWebhookWorker(webhookProcessor);
  createExportWorker(exportProcessor);
  createAuditCleanupWorker(auditCleanupProcessor);
  createIntegrationWorker(integrationProcessor);

  // 4. Schedule recurring jobs
  await recurrenceQueue.add(
    'check-recurrences',
    { triggeredAt: new Date().toISOString() },
    {
      repeat: { every: 5 * 60 * 1000 }, // Check every 5 minutes
      removeOnComplete: true,
      removeOnFail: 100,
    }
  );

  // Check reminders every minute
  await reminderQueue.add(
    'check-reminders',
    { triggeredAt: new Date().toISOString() },
    {
      repeat: { every: 60 * 1000 }, // Every minute
      removeOnComplete: true,
      removeOnFail: 100,
    }
  );

  // Check digests every hour (users filter by their timezone)
  await digestQueue.add(
    'send-digests',
    { triggeredAt: new Date().toISOString() },
    {
      repeat: { every: 60 * 60 * 1000 }, // Every hour
      removeOnComplete: true,
      removeOnFail: 100,
    }
  );

  // Check scheduled reports every 5 minutes
  await scheduledReportQueue.add(
    'check-scheduled-reports',
    { triggeredAt: new Date().toISOString() },
    {
      repeat: { every: 5 * 60 * 1000 }, // Every 5 minutes
      removeOnComplete: true,
      removeOnFail: 100,
    }
  );

  // Audit log cleanup — daily
  await auditCleanupQueue.add(
    'cleanup-old-logs',
    { triggeredAt: new Date().toISOString() },
    {
      repeat: { every: 24 * 60 * 60 * 1000 }, // Daily
      removeOnComplete: true,
      removeOnFail: 10,
    }
  );

  // 5. Create Express app
  const app = await createApp();
  const server = http.createServer(app);

  // 6. Initialize WebSocket — bridges EventBus to connected clients
  initSocketServer(server);

  // 7. Start listening
  server.listen(config.PORT, () => {
    const startupSeconds = Number(process.hrtime.bigint() - startupStart) / 1e9;
    appStartupDuration.set(startupSeconds);
    logger.info({ port: config.PORT, env: config.NODE_ENV, startupSeconds }, 'Server running');
    logger.info({ url: `http://localhost:${config.PORT}/health` }, 'Health check endpoint');
  });

  // 8. Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutdown signal received');

    server.close(async () => {
      logger.info('HTTP server closed');
      try {
        await disconnectMongoDB();
        await disconnectRedis();
        logger.info('Graceful shutdown complete');
        process.exit(0);
      } catch (err) {
        logger.error({ err }, 'Error during shutdown');
        process.exit(1);
      }
    });

    // Force exit after 10s if graceful shutdown hangs
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    logger.error({ err: reason }, 'Unhandled Promise Rejection');
    if (config.NODE_ENV === 'production') process.exit(1);
  });
}

start().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});
