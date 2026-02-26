import { TaskRepository, TaskFilters } from './task.repository';
import { RequestContext } from '@core/context/RequestContext';
import { ForbiddenError, NotFoundError } from '@core/errors/AppError';
import { EventBus } from '@core/events/EventBus';
import { ITask } from './task.model';
import { PaginatedResult, PaginationQuery, TaskStatus, TaskPriority } from '../../types';

export class TaskService {
  private repo: TaskRepository;

  constructor() {
    this.repo = new TaskRepository();
  }

  async list(
    filters: TaskFilters,
    query: PaginationQuery
  ): Promise<PaginatedResult<ITask>> {
    const { tenantId } = RequestContext.get();
    return this.repo.findAll(tenantId, filters, query);
  }

  async getById(taskId: string): Promise<ITask> {
    const { tenantId } = RequestContext.get();
    const task = await this.repo.findById(tenantId, taskId);
    if (!task) throw new NotFoundError('Task');
    return task;
  }

  async create(data: {
    title: string;
    description?: string;
    projectId: string;
    assigneeId?: string;
    priority?: TaskPriority;
    dueDate?: Date;
    tags?: string[];
  }): Promise<ITask> {
    const { tenantId, userId } = RequestContext.get();

    const task = await this.repo.create({
      tenantId,
      reporterId: userId,
      ...data,
    });

    // EventBus decouples task creation from notifications/WebSocket
    await EventBus.emit('task.created', {
      taskId: task.id as string,
      tenantId,
      assigneeId: task.assigneeId,
      createdBy: userId,
    });

    return task;
  }

  async update(
    taskId: string,
    data: {
      title?: string;
      description?: string;
      assigneeId?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      dueDate?: Date;
      tags?: string[];
    }
  ): Promise<ITask> {
    const { tenantId, userId } = RequestContext.get();

    const existing = await this.repo.findById(tenantId, taskId);
    if (!existing) throw new NotFoundError('Task');

    // Set completedAt when status transitions to done
    const updateData: Partial<ITask> = { ...data };
    if (data.status === 'done' && existing.status !== 'done') {
      updateData.completedAt = new Date();
    } else if (data.status && data.status !== 'done') {
      updateData.completedAt = undefined;
    }

    const updated = await this.repo.update(tenantId, taskId, updateData);
    if (!updated) throw new NotFoundError('Task');

    // Emit assignment event if assignee changed
    if (data.assigneeId && data.assigneeId !== existing.assigneeId) {
      await EventBus.emit('task.assigned', {
        taskId,
        tenantId,
        assigneeId: data.assigneeId,
        assignedBy: userId,
      });
    }

    // Emit completion event
    if (data.status === 'done' && existing.status !== 'done') {
      await EventBus.emit('task.completed', {
        taskId,
        tenantId,
        completedBy: userId,
      });
    }

    return updated;
  }

  async delete(taskId: string): Promise<void> {
    const { tenantId, userId, role } = RequestContext.get();

    const task = await this.repo.findById(tenantId, taskId);
    if (!task) throw new NotFoundError('Task');

    // Only reporter, assignee, or admins/owners can delete
    const canDelete =
      task.reporterId === userId ||
      task.assigneeId === userId ||
      ['owner', 'admin'].includes(role);

    if (!canDelete) throw new ForbiddenError('You cannot delete this task');

    await this.repo.softDelete(tenantId, taskId);

    await EventBus.emit('task.deleted', { taskId, tenantId, deletedBy: userId });
  }
}
