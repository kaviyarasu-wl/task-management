import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, ValidationError } from '@core/errors/AppError';
import { logger } from '@infrastructure/logger';
import { Sentry } from '@infrastructure/sentry';
import { t } from '@infrastructure/i18n/i18n';
import { config } from '../../config';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Zod validation errors — convert to our ValidationError format
  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    err.errors.forEach((e) => {
      const key = e.path.join('.');
      errors[key] = errors[key] ?? [];
      errors[key].push(e.message);
    });
    res.status(422).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: t('common.validationFailed'),
      errors,
    });
    return;
  }

  // Our custom operational errors — safe to expose to client
  if (err instanceof ValidationError) {
    res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      errors: err.errors,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
    });
    return;
  }

  // Unknown error — log it, don't expose internals
  const requestId = req.headers['x-request-id'] as string | undefined;
  logger.error({ err, requestId }, 'Unhandled error');
  Sentry.captureException(err, { extra: { requestId } });

  res.status(500).json({
    success: false,
    code: 'INTERNAL_ERROR',
    message: config.NODE_ENV === 'production' ? t('common.internalError') : err.message,
    ...(config.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}
