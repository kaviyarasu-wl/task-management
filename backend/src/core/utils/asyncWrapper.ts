import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async Express handler so thrown errors are forwarded to
 * the global error handler instead of crashing the process.
 *
 * Usage:
 *   router.get('/tasks', asyncWrapper(taskController.list));
 *
 * Without this, you need try/catch in every controller method.
 */
export function asyncWrapper(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
