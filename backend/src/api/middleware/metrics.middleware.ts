import { Request, Response, NextFunction } from 'express';
import { httpRequestDuration, httpRequestTotal } from '@infrastructure/metrics';

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
    // Use matched route pattern when available, fall back to path
    const route = req.route?.path ?? req.path;
    const labels = {
      method: req.method,
      route,
      status_code: res.statusCode.toString(),
    };

    httpRequestDuration.observe(labels, durationSeconds);
    httpRequestTotal.inc(labels);
  });

  next();
}
