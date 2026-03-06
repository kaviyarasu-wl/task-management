import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { config } from './config';
import { getRedisClient } from '@infrastructure/redis/client';
import { requestIdMiddleware } from './api/middleware/requestId.middleware';
import { httpLogger } from './api/middleware/httpLogger.middleware';
import { errorHandler } from './api/middleware/errorHandler.middleware';
import { authRouter } from './api/routes/auth.routes';
import { projectRouter } from './api/routes/project.routes';
import { taskRouter } from './api/routes/task.routes';
import { tenantRouter } from './api/routes/tenant.routes';
import { statusRouter } from './api/routes/status.routes';
import { userRouter } from './api/routes/user.routes';
import { invitationRouter } from './api/routes/invitation.routes';
import { commentRouter } from './api/routes/comment.routes';
import { activityRouter } from './api/routes/activity.routes';
import { timeEntryRouter } from './api/routes/timeEntry.routes';
import { recurrenceRouter } from './api/routes/recurrence.routes';
import { reminderRouter } from './api/routes/reminder.routes';
import { reportsRouter } from './api/routes/reports.routes';
import { exportRouter } from './api/routes/export.routes';
import { webhookRouter } from './api/routes/webhook.routes';
import { apiKeyRouter } from './api/routes/apiKey.routes';
import { adminRoutes } from '@modules/admin/admin.routes';
import { uploadRouter } from '@modules/upload/upload.routes';
import { searchRouter } from '@modules/search/search.routes';
import { notificationRouter } from '@modules/notification/notification.routes';
import { roleRouter } from '@modules/role/role.routes';
import { oauthRouter } from '@modules/auth/oauth/oauth.routes';
import { mfaRouter } from '@modules/auth/mfa/mfa.routes';
import { metricsMiddleware } from './api/middleware/metrics.middleware';
import { metricsRouter } from './api/routes/metrics.routes';
import { auditRouter } from '@modules/audit/audit.routes';
import { integrationRouter } from '@modules/integration/integration.routes';
import { savedViewRouter } from '@modules/savedView/savedView.routes';
import { auditMiddleware } from './api/middleware/audit.middleware';
import { localeMiddleware } from './api/middleware/locale.middleware';
import { responseTimeMiddleware } from './api/middleware/responseTime.middleware';

export async function createApp(): Promise<express.Application> {
  const app = express();

  // Response time tracking — must be first to capture full request duration
  app.use(responseTimeMiddleware);

  // Prometheus metrics collection — before all routes
  app.use(metricsMiddleware);
  // Metrics endpoint (no auth — restrict to internal network via nginx)
  app.use(metricsRouter);

  // Security headers
  app.use(helmet());

  // Trust proxy (when behind nginx/load balancer)
  if (config.TRUST_PROXY) {
    app.set('trust proxy', 1);
  }

  // CORS
  app.use(
    cors({
      origin: config.CORS_ORIGINS === '*' ? '*' : config.CORS_ORIGINS,
      credentials: true,
    })
  );

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Detect locale from Accept-Language header
  app.use(localeMiddleware);

  // Request ID + structured HTTP logging (skip in test)
  app.use(requestIdMiddleware);
  if (config.NODE_ENV !== 'test') {
    app.use(httpLogger);
  }

  // Liveness probe — is the process alive?
  app.get('/health/live', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Readiness probe — can the app serve traffic?
  app.get('/health/ready', async (_req, res) => {
    try {
      const mongoState = mongoose.connection.readyState;
      if (mongoState !== 1) throw new Error('MongoDB not ready');

      const redis = getRedisClient();
      await redis.ping();

      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: { mongodb: 'connected', redis: 'connected' },
      });
    } catch (err) {
      res.status(503).json({
        status: 'unavailable',
        timestamp: new Date().toISOString(),
        error: (err as Error).message,
      });
    }
  });

  // Backwards-compatible health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Serve uploaded files from local filesystem
  if (config.STORAGE_PROVIDER === 'local') {
    app.use('/uploads', (_req, res, next) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      next();
    }, express.static(path.resolve(config.UPLOAD_DIR)));
  }

  // Audit middleware — logs all mutating HTTP requests (fire-and-forget)
  app.use(auditMiddleware);

  // Routes
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/auth/oauth', oauthRouter);
  app.use('/api/v1/auth/mfa', mfaRouter);
  app.use('/api/v1/tenants', tenantRouter);
  app.use('/api/v1/users', userRouter);
  app.use('/api/v1/projects', projectRouter);
  app.use('/api/v1/status', statusRouter);
  app.use('/api/v1/tasks', taskRouter);
  app.use('/api/v1/invitations', invitationRouter);

  // Admin routes (separate authentication system) — must be before commentRouter
  // because commentRouter is mounted at broad '/api/v1' and applies authMiddleware globally
  app.use('/api/v1/admin', adminRoutes);

  app.use('/api/v1', commentRouter); // Comments nested under /tasks/:taskId/comments
  app.use('/api/v1/activity', activityRouter);
  app.use('/api/v1/time-entries', timeEntryRouter);
  app.use('/api/v1/recurrences', recurrenceRouter);
  app.use('/api/v1/reminders', reminderRouter);
  app.use('/api/v1/reports', reportsRouter);
  app.use('/api/v1/export', exportRouter);
  app.use('/api/v1/webhooks', webhookRouter);
  app.use('/api/v1/api-keys', apiKeyRouter);
  app.use('/api/v1/uploads', uploadRouter);
  app.use('/api/v1/search', searchRouter);
  app.use('/api/v1/notifications', notificationRouter);
  app.use('/api/v1/roles', roleRouter);
  app.use('/api/v1/audit-logs', auditRouter);
  app.use('/api/v1/integrations', integrationRouter);
  app.use('/api/v1/saved-views', savedViewRouter);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Route not found' });
  });

  // Global error handler — MUST be last, MUST have 4 params
  app.use(errorHandler);

  return app;
}
