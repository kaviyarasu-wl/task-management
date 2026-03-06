import { Request, Response } from 'express';
import { SavedViewService } from './savedView.service';
import {
  createSavedViewSchema,
  updateSavedViewSchema,
  savedViewListSchema,
  savedViewIdParamSchema,
  setDefaultSchema,
} from '@api/validators/savedView.validator';

const savedViewService = new SavedViewService();

export const savedViewController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = savedViewListSchema.parse(req.query);
    const views = await savedViewService.list(query);
    res.json({ success: true, data: views });
  },

  async create(req: Request, res: Response): Promise<void> {
    const input = createSavedViewSchema.parse(req.body);
    const view = await savedViewService.create(input);
    res.status(201).json({ success: true, data: view });
  },

  async update(req: Request, res: Response): Promise<void> {
    const { id } = savedViewIdParamSchema.parse(req.params);
    const input = updateSavedViewSchema.parse(req.body);
    const view = await savedViewService.update(id, input);
    res.json({ success: true, data: view });
  },

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = savedViewIdParamSchema.parse(req.params);
    await savedViewService.delete(id);
    res.json({ success: true, message: 'Saved view deleted' });
  },

  async setDefault(req: Request, res: Response): Promise<void> {
    const { id } = savedViewIdParamSchema.parse(req.params);
    const { isDefault } = setDefaultSchema.parse(req.body);
    const view = await savedViewService.setDefault(id, isDefault);
    res.json({ success: true, data: view });
  },
};
