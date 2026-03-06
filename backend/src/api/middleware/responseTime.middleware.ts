import { Request, Response, NextFunction } from 'express';
import { createLogger } from '@infrastructure/logger';

const log = createLogger('ResponseTime');

/** Threshold in milliseconds above which a request is considered slow */
const SLOW_REQUEST_THRESHOLD_MS = 200;

/**
 * Measures and adds X-Response-Time header to every response.
 * Logs slow requests (>200ms) for monitoring.
 *
 * Must be mounted as the first middleware in the chain so the
 * timer starts before any other processing.
 */
export function responseTimeMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = process.hrtime.bigint();

  // Hook into response finish to calculate duration
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1_000_000;
    const rounded = Math.round(durationMs * 100) / 100;

    // Header must be set before finish in practice — use 'close' or
    // set it earlier. Since we're past `finish`, the header won't
    // reach the client. Instead, set it on the `header` event.
    // This log is still valuable for monitoring.
    if (durationMs > SLOW_REQUEST_THRESHOLD_MS) {
      log.warn(
        { method: req.method, url: req.originalUrl, durationMs: rounded },
        `Slow request: ${req.method} ${req.originalUrl} took ${rounded}ms`
      );
    }
  });

  // Set the header before response body is sent
  const originalEnd = res.end.bind(res);
  res.end = function (...args: Parameters<typeof res.end>) {
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1_000_000;
    const rounded = Math.round(durationMs * 100) / 100;
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', `${rounded}ms`);
    }
    return originalEnd(...args);
  } as typeof res.end;

  next();
}
