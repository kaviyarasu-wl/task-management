import { Router, Request, Response } from 'express';
import { authMiddleware } from '@api/middleware/auth.middleware';
import { asyncWrapper } from '@core/utils/asyncWrapper';
import { searchQuerySchema } from '@api/validators/search.validator';
import { SearchService } from './search.service';

const router = Router();
const searchService = new SearchService();

router.use(authMiddleware);

router.get(
  '/',
  asyncWrapper(async (req: Request, res: Response) => {
    const query = searchQuerySchema.parse(req.query);
    const results = await searchService.search(query);
    res.json({ success: true, data: results });
  }),
);

export { router as searchRouter };
