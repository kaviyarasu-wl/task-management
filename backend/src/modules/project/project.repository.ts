import { Project, IProject } from './project.model';
import { PaginatedResult, PaginationQuery } from '../../types';

export class ProjectRepository {
  async findById(tenantId: string, projectId: string): Promise<IProject | null> {
    return Project.findOne({ _id: projectId, tenantId }).exec();
  }

  async findAll(
    tenantId: string,
    query: PaginationQuery & { includeArchived?: boolean }
  ): Promise<PaginatedResult<IProject>> {
    const limit = Math.min(query.limit ?? 20, 100);
    const filter: Record<string, unknown> = { tenantId };
    if (!query.includeArchived) filter['isArchived'] = false;

    // Cursor-based pagination using _id
    if (query.cursor) {
      filter['_id'] = { $lt: query.cursor };
    }

    const data = await Project.find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1) // Fetch one extra to determine if there's a next page
      .exec();

    const hasMore = data.length > limit;
    if (hasMore) data.pop();

    const total = await Project.countDocuments({ tenantId, isArchived: false }).exec();

    return {
      data,
      nextCursor: hasMore ? (data[data.length - 1]._id as string).toString() : null,
      total,
    };
  }

  async create(data: {
    tenantId: string;
    name: string;
    description?: string;
    ownerId: string;
    color?: string;
  }): Promise<IProject> {
    const project = new Project(data);
    return project.save();
  }

  async update(tenantId: string, projectId: string, data: Partial<IProject>): Promise<IProject | null> {
    return Project.findOneAndUpdate(
      { _id: projectId, tenantId },
      { $set: data },
      { new: true }
    ).exec();
  }

  async softDelete(tenantId: string, projectId: string): Promise<boolean> {
    const result = await Project.findOneAndUpdate(
      { _id: projectId, tenantId },
      { deletedAt: new Date() }
    ).exec();
    return result !== null;
  }
}
