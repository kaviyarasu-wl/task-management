import { Request, Response, NextFunction, RequestHandler } from 'express';
import { transitionService } from '@modules/status/transition.service';

/**
 * Middleware to validate task status transitions.
 * Should be applied to task update routes that may change status.
 *
 * Checks if the requested status change is allowed by workflow rules.
 * Skips validation if status is not being changed.
 *
 * @throws TransitionNotAllowedError if the status transition is not permitted
 */
export function validateTransition(): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // Support both :taskId and :id param naming conventions
    const taskId = req.params['taskId'] ?? req.params['id'];
    const { status: newStatusId } = req.body;
    const tenantId = req.user?.tenantId;

    // Status field contains ObjectId string
    const targetStatusId = newStatusId;

    // Skip if no status change requested
    if (!targetStatusId) {
      next();
      return;
    }

    // Skip if no tenant context (shouldn't happen with auth middleware)
    if (!tenantId) {
      next();
      return;
    }

    // Skip if no task ID in params (non-standard route)
    if (!taskId) {
      next();
      return;
    }

    // Validate the transition asynchronously
    transitionService
      .validateTaskTransition(taskId, targetStatusId, tenantId)
      .then(() => next())
      .catch(next);
  };
}

/**
 * Standalone async function for use in custom handlers.
 * Useful when transition validation needs to happen within a controller.
 *
 * @example
 * async function updateTask(req, res, next) {
 *   const { taskId } = req.params;
 *   const { statusId } = req.body;
 *
 *   if (statusId) {
 *     await validateTaskStatusTransition(taskId, statusId, req.user.tenantId);
 *   }
 *
 *   // Continue with update...
 * }
 */
export async function validateTaskStatusTransition(
  taskId: string,
  newStatusId: string,
  tenantId: string
): Promise<void> {
  await transitionService.validateTaskTransition(taskId, newStatusId, tenantId);
}
