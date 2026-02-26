import { ProjectRepository } from './project.repository';
import { RequestContext } from '@core/context/RequestContext';
import { ForbiddenError, NotFoundError } from '@core/errors/AppError';
import { IProject } from './project.model';
import { PaginatedResult, PaginationQuery } from '../../types';

export class ProjectService {
  private repo: ProjectRepository;

  constructor() {
    this.repo = new ProjectRepository();
  }

  async list(query: PaginationQuery & { includeArchived?: boolean }): Promise<PaginatedResult<IProject>> {
    const { tenantId } = RequestContext.get();
    return this.repo.findAll(tenantId, query);
  }

  async getById(projectId: string): Promise<IProject> {
    const { tenantId } = RequestContext.get();
    const project = await this.repo.findById(tenantId, projectId);
    if (!project) throw new NotFoundError('Project');
    return project;
  }

  async create(data: { name: string; description?: string; color?: string }): Promise<IProject> {
    const { tenantId, userId } = RequestContext.get();
    return this.repo.create({ tenantId, ownerId: userId, ...data });
  }

  async update(projectId: string, data: { name?: string; description?: string; isArchived?: boolean; color?: string }): Promise<IProject> {
    const { tenantId, userId, role } = RequestContext.get();

    const project = await this.repo.findById(tenantId, projectId);
    if (!project) throw new NotFoundError('Project');

    // Only project owner or admins can update
    if (project.ownerId !== userId && !['owner', 'admin'].includes(role)) {
      throw new ForbiddenError('Only the project owner or admins can update this project');
    }

    const updated = await this.repo.update(tenantId, projectId, data);
    if (!updated) throw new NotFoundError('Project');
    return updated;
  }

  async delete(projectId: string): Promise<void> {
    const { tenantId, userId, role } = RequestContext.get();

    const project = await this.repo.findById(tenantId, projectId);
    if (!project) throw new NotFoundError('Project');

    if (project.ownerId !== userId && !['owner', 'admin'].includes(role)) {
      throw new ForbiddenError('Only the project owner or admins can delete this project');
    }

    await this.repo.softDelete(tenantId, projectId);
  }
}
