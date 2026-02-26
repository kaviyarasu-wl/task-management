import { Request, Response } from 'express';
import { ProjectService } from './project.service';
import {
  createProjectSchema,
  updateProjectSchema,
  projectQuerySchema,
} from '@api/validators/project.validator';

const projectService = new ProjectService();

export const projectController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = projectQuerySchema.parse(req.query);
    const result = await projectService.list(query);
    res.json({ success: true, ...result });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const project = await projectService.getById(req.params['id']!);
    res.json({ success: true, data: project });
  },

  async create(req: Request, res: Response): Promise<void> {
    const input = createProjectSchema.parse(req.body);
    const project = await projectService.create(input);
    res.status(201).json({ success: true, data: project });
  },

  async update(req: Request, res: Response): Promise<void> {
    const input = updateProjectSchema.parse(req.body);
    const project = await projectService.update(req.params['id']!, input);
    res.json({ success: true, data: project });
  },

  async delete(req: Request, res: Response): Promise<void> {
    await projectService.delete(req.params['id']!);
    res.json({ success: true, message: 'Project deleted' });
  },
};
