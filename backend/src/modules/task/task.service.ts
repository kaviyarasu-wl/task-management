import { Types } from 'mongoose';
import { TaskRepository, TaskFilters } from './task.repository';
import { RequestContext } from '@core/context/RequestContext';
import { ForbiddenError, NotFoundError } from '@core/errors/AppError';
import { EventBus } from '@core/events/EventBus';
import { ITask, ITaskWithStatus } from './task.model';
import { StatusService } from '../status/status.service';
import { TransitionService } from '../status/transition.service';
import { ReminderService } from '../reminder/reminder.service';
import { PaginatedResult, PaginationQuery, TaskPriority, StatusCategory } from '../../types';

export class TaskService {
  private repo: TaskRepository;
  private statusService: StatusService;
  private transitionService: TransitionService;
  private reminderService: ReminderService;

  constructor() {
    this.repo = new TaskRepository();
    this.statusService = new StatusService();
    this.transitionService = new TransitionService();
    this.reminderService = new ReminderService();
  }

  async list(
    filters: TaskFilters,
    query: PaginationQuery
  ): Promise<PaginatedResult<ITask | ITaskWithStatus>> {
    const { tenantId } = RequestContext.get();
    return this.repo.findAll(tenantId, filters, query, { populate: ['status'] });
  }

  async getById(taskId: string): Promise<ITask | ITaskWithStatus> {
    const { tenantId } = RequestContext.get();
    const task = await this.repo.findById(tenantId, taskId, { populate: ['status'] });
    if (!task) throw new NotFoundError('Task');
    return task;
  }

  async create(data: {
    title: string;
    description?: string;
    projectId: string;
    assigneeId?: string;
    status?: string; // ObjectId string, optional - uses default if not provided
    priority?: TaskPriority;
    dueDate?: Date;
    tags?: string[];
  }): Promise<ITask | ITaskWithStatus> {
    const { tenantId, userId } = RequestContext.get();

    // If no status provided, use tenant's default status
    let statusId = data.status;
    if (!statusId) {
      const defaultStatus = await this.statusService.getDefault();
      statusId = defaultStatus._id.toString();
    } else {
      // Validate status exists and belongs to tenant
      await this.statusService.getById(statusId);
    }

    const task = await this.repo.create({
      tenantId,
      reporterId: userId,
      ...data,
      status: statusId,
    });

    // EventBus decouples task creation from notifications/WebSocket
    await EventBus.emit('task.created', {
      taskId: task.id as string,
      tenantId,
      assigneeId: task.assigneeId,
      createdBy: userId,
    });

    // Schedule reminders if due date and assignee are set
    if (task.dueDate && task.assigneeId) {
      await this.reminderService.scheduleForTask(
        tenantId,
        task.id as string,
        task.dueDate,
        task.assigneeId
      );
    }

    // Return with populated status
    const result = await this.repo.findById(tenantId, task.id as string, { populate: ['status'] });
    return result as unknown as ITaskWithStatus;
  }

  async update(
    taskId: string,
    data: {
      title?: string;
      description?: string;
      assigneeId?: string;
      status?: string; // ObjectId string
      priority?: TaskPriority;
      dueDate?: Date;
      tags?: string[];
    }
  ): Promise<ITask | ITaskWithStatus> {
    const { tenantId, userId } = RequestContext.get();

    const existing = await this.repo.findById(tenantId, taskId, { populate: ['status'] });
    if (!existing) throw new NotFoundError('Task');

    const currentStatusId = existing.status.toString();
    const newStatusId = data.status;

    // If status is changing, validate transition
    if (newStatusId && newStatusId !== currentStatusId) {
      // Validate new status exists
      const newStatus = await this.statusService.getById(newStatusId);

      // Validate transition is allowed
      await this.transitionService.validateTaskTransition(taskId, newStatusId, tenantId);

      // Build update data with proper ObjectId for status
      const { status: _statusStr, ...restData } = data;
      const updateData: Partial<ITask> = {
        ...restData,
        status: new Types.ObjectId(newStatusId),
      };

      // Set completedAt when status transitions to a closed category
      if (newStatus.category === 'closed' as StatusCategory) {
        updateData.completedAt = new Date();
      } else {
        updateData.completedAt = undefined;
      }

      const updated = await this.repo.update(tenantId, taskId, updateData);
      if (!updated) throw new NotFoundError('Task');

      // Emit completion event for closed status
      if (newStatus.category === 'closed' as StatusCategory) {
        await EventBus.emit('task.completed', {
          taskId,
          tenantId,
          completedBy: userId,
        });
        // Cancel reminders when task is completed
        await this.reminderService.cancelTaskReminders(taskId);
      }

      // Emit assignment event if assignee changed
      if (data.assigneeId && data.assigneeId !== existing.assigneeId) {
        await EventBus.emit('task.assigned', {
          taskId,
          tenantId,
          assigneeId: data.assigneeId,
          assignedBy: userId,
        });
      }

      // Reschedule reminders if due date changed
      const assigneeId = data.assigneeId || existing.assigneeId;
      const dueDate = data.dueDate || existing.dueDate;
      if (data.dueDate && assigneeId && newStatus.category !== 'closed') {
        await this.reminderService.scheduleForTask(
          tenantId,
          taskId,
          new Date(data.dueDate),
          assigneeId
        );
      }

      // Return with populated status
      const result = await this.repo.findById(tenantId, taskId, { populate: ['status'] });
      return result as unknown as ITaskWithStatus;
    }

    // No status change - just update other fields (exclude status from data)
    const { status: _statusStr, ...updateFields } = data;
    const updated = await this.repo.update(tenantId, taskId, updateFields);
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

    // Reschedule reminders if due date or assignee changed
    const assigneeId = data.assigneeId || existing.assigneeId;
    if (data.dueDate && assigneeId) {
      await this.reminderService.scheduleForTask(
        tenantId,
        taskId,
        new Date(data.dueDate),
        assigneeId
      );
    }

    // Return with populated status
    const finalResult = await this.repo.findById(tenantId, taskId, { populate: ['status'] });
    return finalResult as unknown as ITaskWithStatus;
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

    // Cancel any pending reminders for this task
    await this.reminderService.cancelTaskReminders(taskId);

    await EventBus.emit('task.deleted', { taskId, tenantId, deletedBy: userId });
  }

  async addAttachment(
    taskId: string,
    attachment: { filename: string; url: string }
  ): Promise<ITask | ITaskWithStatus> {
    const { tenantId } = RequestContext.get();

    const task = await this.repo.findById(tenantId, taskId);
    if (!task) throw new NotFoundError('Task');

    const updated = await this.repo.addAttachment(tenantId, taskId, {
      filename: attachment.filename,
      url: attachment.url,
      uploadedAt: new Date(),
    });
    if (!updated) throw new NotFoundError('Task');

    return updated;
  }

  async removeAttachment(taskId: string, filename: string): Promise<ITask | ITaskWithStatus> {
    const { tenantId } = RequestContext.get();

    const task = await this.repo.findById(tenantId, taskId);
    if (!task) throw new NotFoundError('Task');

    const updated = await this.repo.removeAttachment(tenantId, taskId, filename);
    if (!updated) throw new NotFoundError('Task');

    return updated;
  }
}
