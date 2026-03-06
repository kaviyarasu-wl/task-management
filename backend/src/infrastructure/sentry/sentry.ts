import * as Sentry from '@sentry/node';
import { config } from '@config/index';

export function initSentry(): void {
  if (!config.SENTRY_DSN) return;

  Sentry.init({
    dsn: config.SENTRY_DSN,
    environment: config.NODE_ENV,
    tracesSampleRate: config.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      Sentry.mongooseIntegration(),
      Sentry.redisIntegration(),
    ],
  });
}

export { Sentry };
