import { Types } from 'mongoose';
import { RecurrenceRepository, RecurrenceFilters, CreateRecurrenceData } from './recurrence.repository';
import { IRecurrence, RecurrencePattern } from './recurrence.model';
import { TaskService } from '../task/task.service';
import { Task, ITask } from '../task/task.model';
import { RequestContext } from '@core/context/RequestContext';
import { NotFoundError, BadRequestError } from '@core/errors/AppError';
import { EventBus } from '@core/events/EventBus';
import { PaginatedResult, PaginationQuery } from '../../types';

export interface RecurrenceOptions {
  endDate?: Date;
  endAfterCount?: number;
}

export class RecurrenceService {
  private repo: RecurrenceRepository;
  private taskService: TaskService;

  constructor() {
    this.repo = new RecurrenceRepository();
    this.taskService = new TaskService();
  }

  async list(
    filters: RecurrenceFilters,
    query: PaginationQuery
  ): Promise<PaginatedResult<IRecurrence>> {
    const { tenantId } = RequestContext.get();
    return this.repo.findAll(tenantId, filters, query);
  }

  async getById(recurrenceId: string): Promise<IRecurrence> {
    const { tenantId } = RequestContext.get();
    const recurrence = await this.repo.findById(tenantId, recurrenceId);
    if (!recurrence) throw new NotFoundError('Recurrence');
    return recurrence;
  }

  async getByTaskId(taskId: string): Promise<IRecurrence | null> {
    const { tenantId } = RequestContext.get();
    return this.repo.findByTaskTemplateId(tenantId, taskId);
  }

  async create(
    taskId: string,
    pattern: RecurrencePattern,
    options?: RecurrenceOptions
  ): Promise<IRecurrence> {
    const { tenantId, userId } = RequestContext.get();

    // Validate task exists
    const task = await this.taskService.getById(taskId);
    if (!task) {
      throw new NotFoundError('Task');
    }

    // Check if recurrence already exists for this task
    const existing = await this.repo.findByTaskTemplateId(tenantId, taskId);
    if (existing) {
      throw new BadRequestError('Task already has a recurrence pattern');
    }

    // Validate pattern
    this.validatePattern(pattern);

    // Calculate first occurrence
    const nextOccurrence = this.calculateNextOccurrence(pattern, new Date());

    // Validate end conditions
    if (options?.endDate && options.endDate < nextOccurrence) {
      throw new BadRequestError('End date must be after the first occurrence');
    }

    const data: CreateRecurrenceData = {
      tenantId,
      taskTemplateId: taskId,
      pattern,
      nextOccurrence,
      endDate: options?.endDate,
      endAfterCount: options?.endAfterCount,
      createdBy: userId,
    };

    const recurrence = await this.repo.create(data);

    await EventBus.emit('recurrence.created', {
      recurrenceId: recurrence.id as string,
      taskId,
      tenantId,
      createdBy: userId,
    });

    return recurrence;
  }

  async update(
    recurrenceId: string,
    data: {
      pattern?: RecurrencePattern;
      endDate?: Date;
      endAfterCount?: number;
      isActive?: boolean;
    }
  ): Promise<IRecurrence> {
    const { tenantId, userId } = RequestContext.get();

    const existing = await this.repo.findById(tenantId, recurrenceId);
    if (!existing) {
      throw new NotFoundError('Recurrence');
    }

    // If pattern changed, recalculate next occurrence
    const updateData: Partial<IRecurrence> = {};

    if (data.pattern) {
      this.validatePattern(data.pattern);
      updateData.pattern = data.pattern;
      updateData.nextOccurrence = this.calculateNextOccurrence(data.pattern, new Date());
    }

    if (data.endDate !== undefined) {
      updateData.endDate = data.endDate;
    }

    if (data.endAfterCount !== undefined) {
      updateData.endAfterCount = data.endAfterCount;
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    const updated = await this.repo.update(tenantId, recurrenceId, updateData);
    if (!updated) {
      throw new NotFoundError('Recurrence');
    }

    await EventBus.emit('recurrence.updated', {
      recurrenceId,
      tenantId,
      updatedBy: userId,
    });

    return updated;
  }

  async delete(recurrenceId: string): Promise<void> {
    const { tenantId, userId } = RequestContext.get();

    const existing = await this.repo.findById(tenantId, recurrenceId);
    if (!existing) {
      throw new NotFoundError('Recurrence');
    }

    await this.repo.softDelete(tenantId, recurrenceId);

    await EventBus.emit('recurrence.deleted', {
      recurrenceId,
      taskId: existing.taskTemplateId.toString(),
      tenantId,
      deletedBy: userId,
    });
  }

  async deactivate(recurrenceId: string): Promise<void> {
    const { tenantId, userId } = RequestContext.get();

    const existing = await this.repo.findById(tenantId, recurrenceId);
    if (!existing) {
      throw new NotFoundError('Recurrence');
    }

    await this.repo.deactivate(tenantId, recurrenceId);

    await EventBus.emit('recurrence.deactivated', {
      recurrenceId,
      tenantId,
      deactivatedBy: userId,
    });
  }

  /**
   * Generate a new task from a recurrence pattern.
   * Called by the recurrence processor job.
   */
  async generateTask(recurrence: IRecurrence): Promise<ITask> {
    // Get template task
    const template = await Task.findOne({
      _id: recurrence.taskTemplateId,
      tenantId: recurrence.tenantId,
    }).exec();

    if (!template) {
      // Template task was deleted, deactivate recurrence
      await this.repo.deactivate(recurrence.tenantId, recurrence.id as string);
      throw new NotFoundError('Template task no longer exists');
    }

    // Calculate new due date based on the original task's due date offset
    let newDueDate: Date | undefined;
    if (template.dueDate) {
      const templateCreatedAt = template.createdAt;
      const dueDateOffset = template.dueDate.getTime() - templateCreatedAt.getTime();
      newDueDate = new Date(Date.now() + dueDateOffset);
    }

    // Create new task by running within a synthetic request context
    const newTask = await RequestContext.run(
      {
        tenantId: recurrence.tenantId,
        userId: recurrence.createdBy,
        email: 'system@recurrence.internal',
        role: 'member',
        requestId: `recurrence-${recurrence.id}-${Date.now()}`,
        locale: 'en',
      },
      async () => {
        return this.taskService.create({
          title: template.title,
          description: template.description,
          projectId: template.projectId,
          assigneeId: template.assigneeId,
          status: template.status.toString(),
          priority: template.priority,
          dueDate: newDueDate,
          tags: template.tags,
        });
      }
    );

    // Calculate next occurrence
    const nextOccurrence = this.calculateNextOccurrence(
      recurrence.pattern,
      recurrence.nextOccurrence
    );

    // Check if recurrence should be deactivated
    const newCount = recurrence.occurrenceCount + 1;
    let shouldDeactivate = false;

    if (recurrence.endAfterCount && newCount >= recurrence.endAfterCount) {
      shouldDeactivate = true;
    }

    if (recurrence.endDate && nextOccurrence > recurrence.endDate) {
      shouldDeactivate = true;
    }

    // Update recurrence
    await this.repo.incrementOccurrence(
      recurrence.id as string,
      nextOccurrence,
      shouldDeactivate
    );

    await EventBus.emit('recurrence.taskGenerated', {
      taskId: (newTask as ITask & { _id: Types.ObjectId })._id.toString(),
      recurrenceId: recurrence.id as string,
      tenantId: recurrence.tenantId,
      occurrenceNumber: newCount,
    });

    return newTask as ITask;
  }

  /**
   * Get all recurrences due for task generation.
   * Used by the recurrence processor.
   */
  async getDueForGeneration(): Promise<IRecurrence[]> {
    return this.repo.findDue();
  }

  /**
   * Calculate the next occurrence date based on the recurrence pattern.
   */
  calculateNextOccurrence(pattern: RecurrencePattern, from: Date): Date {
    const next = new Date(from);

    switch (pattern.type) {
      case 'daily':
        next.setDate(next.getDate() + pattern.interval);
        break;

      case 'weekly':
        if (pattern.daysOfWeek?.length) {
          // Find next matching day of week
          const currentDay = next.getDay();
          const sortedDays = [...pattern.daysOfWeek].sort((a, b) => a - b);

          // Find the next day that's greater than current
          let nextDay = sortedDays.find((d) => d > currentDay);

          if (nextDay !== undefined) {
            // Found a day in this week
            next.setDate(next.getDate() + (nextDay - currentDay));
          } else {
            // Wrap to next week(s)
            nextDay = sortedDays[0];
            const daysUntil = 7 - currentDay + nextDay + (pattern.interval - 1) * 7;
            next.setDate(next.getDate() + daysUntil);
          }
        } else {
          // Simple weekly interval
          next.setDate(next.getDate() + pattern.interval * 7);
        }
        break;

      case 'monthly':
        next.setMonth(next.getMonth() + pattern.interval);
        if (pattern.dayOfMonth) {
          // Set to specific day, handling months with fewer days
          const daysInMonth = this.getDaysInMonth(next);
          next.setDate(Math.min(pattern.dayOfMonth, daysInMonth));
        }
        break;

      case 'custom':
        if (pattern.cronExpression) {
          // For custom patterns, use cron-parser
          // Note: You would need to add cron-parser as a dependency
          // For now, fall back to daily
          next.setDate(next.getDate() + (pattern.interval || 1));
        }
        break;

      default:
        // Fallback: daily
        next.setDate(next.getDate() + 1);
    }

    // Normalize to start of day
    next.setHours(0, 0, 0, 0);

    return next;
  }

  /**
   * Get the number of days in a given month.
   */
  private getDaysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  /**
   * Validate a recurrence pattern.
   */
  private validatePattern(pattern: RecurrencePattern): void {
    if (pattern.interval < 1 || pattern.interval > 365) {
      throw new BadRequestError('Interval must be between 1 and 365');
    }

    if (pattern.type === 'weekly' && pattern.daysOfWeek?.length) {
      for (const day of pattern.daysOfWeek) {
        if (day < 0 || day > 6) {
          throw new BadRequestError('Days of week must be between 0 (Sunday) and 6 (Saturday)');
        }
      }
    }

    if (pattern.type === 'monthly' && pattern.dayOfMonth) {
      if (pattern.dayOfMonth < 1 || pattern.dayOfMonth > 31) {
        throw new BadRequestError('Day of month must be between 1 and 31');
      }
    }
  }
}
