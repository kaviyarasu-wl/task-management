import { Task, ITask } from './task.model';
import { PaginatedResult, PaginationQuery, TaskStatus, TaskPriority } from '../../types';

export interface TaskFilters {
  projectId?: string;
  assigneeId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueBefore?: Date;
}

export class TaskRepository {
  async findById(tenantId: string, taskId: string): Promise<ITask | null> {
    return Task.findOne({ _id: taskId, tenantId }).exec();
  }

  async findAll(
    tenantId: string,
    filters: TaskFilters,
    query: PaginationQuery
  ): Promise<PaginatedResult<ITask>> {
    const limit = Math.min(query.limit ?? 20, 100);
    const filter: Record<string, unknown> = { tenantId };

    if (filters.projectId) filter['projectId'] = filters.projectId;
    if (filters.assigneeId) filter['assigneeId'] = filters.assigneeId;
    if (filters.status) filter['status'] = filters.status;
    if (filters.priority) filter['priority'] = filters.priority;
    if (filters.dueBefore) filter['dueDate'] = { $lte: filters.dueBefore };
    if (query.cursor) filter['_id'] = { $lt: query.cursor };

    const data = await Task.find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .exec();

    const hasMore = data.length > limit;
    if (hasMore) data.pop();

    const total = await Task.countDocuments({ tenantId, ...filter }).exec();

    return {
      data,
      nextCursor: hasMore ? (data[data.length - 1]._id as string).toString() : null,
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
}
