import { Router, Request, Response } from 'express';
import { authMiddleware } from '@api/middleware/auth.middleware';
import { validateTransition } from '@api/middleware/validateTransition.middleware';
import { asyncWrapper } from '@core/utils/asyncWrapper';
import { TaskService } from '@modules/task/task.service';
import { createTaskSchema, updateTaskSchema, taskQuerySchema } from '@api/validators/task.validator';

const router = Router();
const taskService = new TaskService();

router.use(authMiddleware); // All task routes require auth

router.get(
  '/',
  asyncWrapper(async (req: Request, res: Response) => {
    const query = taskQuerySchema.parse(req.query);
    const { projectId, assigneeId, status, priority, cursor, limit } = query;
    const result = await taskService.list(
      { projectId, assigneeId, status, priority },
      { cursor, limit }
    );
    res.json({ success: true, ...result });
  })
);

router.get(
  '/:id',
  asyncWrapper(async (req: Request, res: Response) => {
    const task = await taskService.getById(req.params['id']!);
    res.json({ success: true, data: task });
  })
);

router.post(
  '/',
  asyncWrapper(async (req: Request, res: Response) => {
    const input = createTaskSchema.parse(req.body);
    const task = await taskService.create(input);
    res.status(201).json({ success: true, data: task });
  })
);

router.patch(
  '/:id',
  validateTransition(), // Validate status transition if status is being changed
  asyncWrapper(async (req: Request, res: Response) => {
    const input = updateTaskSchema.parse(req.body);
    const task = await taskService.update(req.params['id']!, input);
    res.json({ success: true, data: task });
  })
);

router.delete(
  '/:id',
  asyncWrapper(async (req: Request, res: Response) => {
    await taskService.delete(req.params['id']!);
    res.json({ success: true, message: 'Task deleted' });
  })
);

export { router as taskRouter };
