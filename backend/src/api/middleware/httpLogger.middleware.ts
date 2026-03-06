import pinoHttp from 'pino-http';
import { logger } from '@infrastructure/logger';

export const httpLogger = pinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => req.url === '/health',
  },
  customProps: (req) => ({
    requestId: req.headers['x-request-id'],
  }),
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      headers: { 'user-agent': req.headers['user-agent'] },
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
});
