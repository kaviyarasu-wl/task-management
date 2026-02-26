import { Request, Response } from 'express';
import { StatusService } from './status.service';
import {
  createStatusSchema,
  updateStatusSchema,
  reorderStatusSchema,
  statusIdParamSchema,
  updateTransitionsSchema,
} from '@api/validators/status.validator';

const statusService = new StatusService();

export const statusController = {
  /**
   * GET /api/v1/statuses
   * List all statuses for the current tenant, sorted by order.
   */
  async list(_req: Request, res: Response): Promise<void> {
    const statuses = await statusService.getAll();
    res.json({ success: true, data: statuses });
  },

  /**
   * GET /api/v1/statuses/default
   * Get the default status for new tasks.
   */
  async getDefault(_req: Request, res: Response): Promise<void> {
    const status = await statusService.getDefault();
    res.json({ success: true, data: status });
  },

  /**
   * GET /api/v1/statuses/:id
   * Get a single status by ID.
   */
  async getById(req: Request, res: Response): Promise<void> {
    const { id } = statusIdParamSchema.parse(req.params);
    const status = await statusService.getById(id);
    res.json({ success: true, data: status });
  },

  /**
   * POST /api/v1/statuses
   * Create a new status.
   */
  async create(req: Request, res: Response): Promise<void> {
    const input = createStatusSchema.parse(req.body);
    const status = await statusService.create(input);
    res.status(201).json({ success: true, data: status });
  },

  /**
   * PATCH /api/v1/statuses/:id
   * Update an existing status.
   */
  async update(req: Request, res: Response): Promise<void> {
    const { id } = statusIdParamSchema.parse(req.params);
    const input = updateStatusSchema.parse(req.body);
    const status = await statusService.update(id, input);
    res.json({ success: true, data: status });
  },

  /**
   * DELETE /api/v1/statuses/:id
   * Delete a status.
   */
  async delete(req: Request, res: Response): Promise<void> {
    const { id } = statusIdParamSchema.parse(req.params);
    await statusService.delete(id);
    res.json({ success: true, message: 'Status deleted' });
  },

  /**
   * PUT /api/v1/statuses/reorder
   * Reorder statuses by providing ordered array of IDs.
   */
  async reorder(req: Request, res: Response): Promise<void> {
    const { orderedIds } = reorderStatusSchema.parse(req.body);
    const statuses = await statusService.reorder(orderedIds);
    res.json({ success: true, data: statuses });
  },

  /**
   * PUT /api/v1/statuses/:id/default
   * Set a status as the default for new tasks.
   */
  async setDefault(req: Request, res: Response): Promise<void> {
    const { id } = statusIdParamSchema.parse(req.params);
    const status = await statusService.setDefault(id);
    res.json({ success: true, data: status });
  },

  /**
   * GET /api/v1/statuses/matrix
   * Get the full transition matrix for the tenant.
   */
  async getTransitionMatrix(_req: Request, res: Response): Promise<void> {
    const matrix = await statusService.getTransitionMatrix();
    res.json({ success: true, data: matrix });
  },

  /**
   * GET /api/v1/statuses/:id/transitions
   * Get available transitions from a given status.
   */
  async getAvailableTransitions(req: Request, res: Response): Promise<void> {
    const { id } = statusIdParamSchema.parse(req.params);
    const transitions = await statusService.getAvailableTransitions(id);
    res.json({ success: true, data: transitions });
  },

  /**
   * PUT /api/v1/statuses/:id/transitions
   * Update the allowed transitions for a status.
   */
  async updateTransitions(req: Request, res: Response): Promise<void> {
    const { id } = statusIdParamSchema.parse(req.params);
    const { allowedTransitions } = updateTransitionsSchema.parse(req.body);
    const status = await statusService.setTransitions(id, allowedTransitions);
    res.json({ success: true, data: status });
  },
};
