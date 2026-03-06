import { t } from '@infrastructure/i18n/i18n';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;

  constructor(
    message: string,
    statusCode: number,
    code?: string,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(t('common.notFound', { resource }), 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message?: string) {
    super(message ?? t('common.unauthorized'), 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message?: string) {
    super(message ?? t('common.forbidden'), 403, 'FORBIDDEN');
  }
}

export class ValidationError extends AppError {
  public readonly errors: Record<string, string[]>;

  constructor(errors: Record<string, string[]>) {
    super(t('common.validationFailed'), 422, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

export class BadRequestError extends AppError {
  constructor(message?: string) {
    super(message ?? t('common.badRequest'), 400, 'BAD_REQUEST');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message?: string) {
    super(message ?? t('common.tooManyRequests'), 429, 'RATE_LIMIT_EXCEEDED');
  }
}

export class TransitionNotAllowedError extends AppError {
  public readonly fromStatus: string;
  public readonly toStatus: string;

  constructor(fromStatus: string, toStatus: string) {
    super(
      t('task.transitionNotAllowed', { from: fromStatus, to: toStatus }),
      400,
      'TRANSITION_NOT_ALLOWED'
    );
    this.fromStatus = fromStatus;
    this.toStatus = toStatus;
  }
}
