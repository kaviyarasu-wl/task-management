import { Router, Request, Response } from 'express';
import { register } from '@infrastructure/metrics';

const router = Router();

router.get('/metrics', async (_req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.send(await register.metrics());
});

export { router as metricsRouter };
