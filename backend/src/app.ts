import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
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

export async function createApp(): Promise<express.Application> {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS
  app.use(
    cors({
      origin: config.NODE_ENV === 'production' ? false : '*',
      credentials: true,
    })
  );

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // HTTP request logging (skip in test)
  if (config.NODE_ENV !== 'test') {
    app.use(morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  // Health check — no auth required
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Routes
  app.use('/api/v1/auth', authRouter);
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

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Route not found' });
  });

  // Global error handler — MUST be last, MUST have 4 params
  app.use(errorHandler);

  return app;
}
