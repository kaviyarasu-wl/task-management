import { Task, ITask, ITaskWithStatus } from './task.model';
import { PaginatedResult, PaginationQuery, TaskPriority } from '../../types';

export interface TaskFilters {
  projectId?: string;
  assigneeId?: string;
  status?: string; // ObjectId string
  priority?: TaskPriority;
  dueBefore?: Date;
}

export interface FindOptions {
  populate?: ('status')[];
}

export class TaskRepository {
  async findById(
    tenantId: string,
    taskId: string,
    options?: FindOptions
  ): Promise<ITask | null> {
    let queryBuilder = Task.findOne({ _id: taskId, tenantId, deletedAt: null });

    if (options?.populate?.includes('status')) {
      queryBuilder = queryBuilder.populate('status', 'name color category icon slug order');
    }

    return queryBuilder.exec();
  }

  async findAll(
    tenantId: string,
    filters: TaskFilters,
    query: PaginationQuery,
    options?: FindOptions
  ): Promise<PaginatedResult<ITask | ITaskWithStatus>> {
    const limit = Math.min(query.limit ?? 20, 500);
    const filter: Record<string, unknown> = { tenantId, deletedAt: null };

    if (filters.projectId) filter['projectId'] = filters.projectId;
    if (filters.assigneeId) filter['assigneeId'] = filters.assigneeId;
    if (filters.status) filter['status'] = filters.status;
    if (filters.priority) filter['priority'] = filters.priority;
    if (filters.dueBefore) filter['dueDate'] = { $lte: filters.dueBefore };
    if (query.cursor) filter['_id'] = { $lt: query.cursor };

    let queryBuilder = Task.find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1);

    // Populate status with only needed fields to avoid pulling full documents
    if (options?.populate?.includes('status')) {
      queryBuilder = queryBuilder.populate('status', 'name color category icon slug order');
    }

    const data = await queryBuilder.exec();

    const hasMore = data.length > limit;
    if (hasMore) data.pop();

    const total = await Task.countDocuments({ tenantId, deletedAt: null }).exec();

    return {
      data,
      nextCursor: hasMore ? data[data.length - 1]._id?.toString() ?? null : null,
      total,
    };
  }

  async create(data: {
    tenantId: string;
    title: string;
    description?: string;
    projectId: string;
    reporterId: string;
    assigneeId?: string;
    status: string; // ObjectId as string - required
    priority?: TaskPriority;
    dueDate?: Date;
    tags?: string[];
  }): Promise<ITask> {
    const task = new Task(data);
    return task.save();
  }

  async update(tenantId: string, taskId: string, data: Partial<ITask>): Promise<ITask | null> {
    return Task.findOneAndUpdate(
      { _id: taskId, tenantId },
      { $set: data },
      { new: true }
    ).exec();
  }

  async softDelete(tenantId: string, taskId: string): Promise<boolean> {
    const result = await Task.findOneAndUpdate(
      { _id: taskId, tenantId },
      { deletedAt: new Date() }
    ).exec();
    return result !== null;
  }

  async addAttachment(
    tenantId: string,
    taskId: string,
    attachment: { filename: string; url: string; uploadedAt: Date }
  ): Promise<ITask | null> {
    return Task.findOneAndUpdate(
      { _id: taskId, tenantId, deletedAt: null },
      { $push: { attachments: attachment } },
      { new: true }
    ).exec();
  }

  async removeAttachment(
    tenantId: string,
    taskId: string,
    filename: string
  ): Promise<ITask | null> {
    return Task.findOneAndUpdate(
      { _id: taskId, tenantId, deletedAt: null },
      { $pull: { attachments: { filename } } },
      { new: true }
    ).exec();
  }
}
