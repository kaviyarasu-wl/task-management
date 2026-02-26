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
import { userRouter } from './api/routes/user.routes';

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
  app.use('/api/v1/tasks', taskRouter);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Route not found' });
  });

  // Global error handler — MUST be last, MUST have 4 params
  app.use(errorHandler);

  return app;
}
