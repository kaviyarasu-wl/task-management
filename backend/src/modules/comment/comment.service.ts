import { Types } from 'mongoose';
import { CommentRepository, CommentFilters } from './comment.repository';
import { RequestContext } from '@core/context/RequestContext';
import { ForbiddenError, NotFoundError } from '@core/errors/AppError';
import { EventBus } from '@core/events/EventBus';
import { IComment } from './comment.model';
import { User } from '../user/user.model';
import { Task } from '../task/task.model';
import { PaginatedResult, PaginationQuery } from '../../types';

export class CommentService {
  private repo: CommentRepository;

  constructor() {
    this.repo = new CommentRepository();
  }

  async listByTask(
    taskId: string,
    filters: CommentFilters,
    query: PaginationQuery
  ): Promise<PaginatedResult<IComment>> {
    const { tenantId } = RequestContext.get();

    // Verify task exists
    const task = await Task.findOne({ _id: taskId, tenantId, deletedAt: null }).exec();
    if (!task) throw new NotFoundError('Task');

    return this.repo.findByTask(tenantId, taskId, filters, query, {
      author: true,
      mentions: true,
    });
  }

  async getById(commentId: string): Promise<IComment> {
    const { tenantId } = RequestContext.get();
    const comment = await this.repo.findById(tenantId, commentId, {
      author: true,
      mentions: true,
    });
    if (!comment) throw new NotFoundError('Comment');
    return comment;
  }

  async create(taskId: string, data: { content: string; parentId?: string }): Promise<IComment> {
    const { tenantId, userId } = RequestContext.get();

    // Verify task exists
    const task = await Task.findOne({ _id: taskId, tenantId, deletedAt: null }).exec();
    if (!task) throw new NotFoundError('Task');

    // Verify parent comment exists (if provided)
    if (data.parentId) {
      const parent = await this.repo.findById(tenantId, data.parentId);
      if (!parent) throw new NotFoundError('Parent comment');
      // Ensure parent is for the same task
      if (parent.taskId.toString() !== taskId) {
        throw new ForbiddenError('Parent comment belongs to a different task');
      }
    }

    // Extract @mentions from content
    const mentions = await this.extractMentions(data.content, tenantId);

    const comment = await this.repo.create({
      tenantId,
      taskId,
      authorId: userId,
      content: data.content,
      mentions: mentions.map((u) => u._id.toString()),
      parentId: data.parentId,
    });

    await EventBus.emit('comment.created', {
      commentId: comment._id.toString(),
      taskId,
      tenantId,
      authorId: userId,
      mentions: mentions.map((u) => u._id.toString()),
    });

    // Return with populated author
    const result = await this.repo.findById(tenantId, comment._id.toString(), {
      author: true,
      mentions: true,
    });
    return result as IComment;
  }

  async update(commentId: string, data: { content: string }): Promise<IComment> {
    const { tenantId, userId, role } = RequestContext.get();

    const existing = await this.repo.findById(tenantId, commentId);
    if (!existing) throw new NotFoundError('Comment');

    // Only author or admins can edit comments
    const canEdit =
      existing.authorId.toString() === userId || ['owner', 'admin'].includes(role);

    if (!canEdit) throw new ForbiddenError('You cannot edit this comment');

    // Extract new @mentions from content
    const mentions = await this.extractMentions(data.content, tenantId);

    const updated = await this.repo.update(tenantId, commentId, {
      content: data.content,
      mentions: mentions.map((u) => u._id.toString()),
    });

    if (!updated) throw new NotFoundError('Comment');

    await EventBus.emit('comment.updated', {
      commentId,
      taskId: existing.taskId.toString(),
      tenantId,
      authorId: userId,
    });

    // Return with populated author
    const result = await this.repo.findById(tenantId, commentId, {
      author: true,
      mentions: true,
    });
    return result as IComment;
  }

  async delete(commentId: string): Promise<void> {
    const { tenantId, userId, role } = RequestContext.get();

    const existing = await this.repo.findById(tenantId, commentId);
    if (!existing) throw new NotFoundError('Comment');

    // Only author or admins can delete comments
    const canDelete =
      existing.authorId.toString() === userId || ['owner', 'admin'].includes(role);

    if (!canDelete) throw new ForbiddenError('You cannot delete this comment');

    await this.repo.softDelete(tenantId, commentId);

    await EventBus.emit('comment.deleted', {
      commentId,
      taskId: existing.taskId.toString(),
      tenantId,
      deletedBy: userId,
    });
  }

  async addAttachment(
    commentId: string,
    attachment: {
      uploadId: string;
      filename: string;
      url: string;
      mimetype: string;
      size: number;
    }
  ): Promise<IComment> {
    const { tenantId } = RequestContext.get();

    const comment = await this.repo.findById(tenantId, commentId);
    if (!comment) throw new NotFoundError('Comment');

    const updated = await this.repo.addAttachment(tenantId, commentId, {
      uploadId: new Types.ObjectId(attachment.uploadId),
      filename: attachment.filename,
      url: attachment.url,
      mimetype: attachment.mimetype,
      size: attachment.size,
    });
    if (!updated) throw new NotFoundError('Comment');

    return updated;
  }

  async removeAttachment(commentId: string, uploadId: string): Promise<IComment> {
    const { tenantId } = RequestContext.get();

    const comment = await this.repo.findById(tenantId, commentId);
    if (!comment) throw new NotFoundError('Comment');

    const updated = await this.repo.removeAttachment(tenantId, commentId, uploadId);
    if (!updated) throw new NotFoundError('Comment');

    return updated;
  }

  /**
   * Extract @username mentions from content and resolve to user IDs.
   * Matches patterns like @john or @jane.doe
   */
  private async extractMentions(
    content: string,
    tenantId: string
  ): Promise<Array<{ _id: string; email: string }>> {
    // Match @mentions (alphanumeric, dots, underscores, hyphens)
    const mentionPattern = /@([\w.-]+)/g;
    const matches = [...content.matchAll(mentionPattern)];

    if (matches.length === 0) return [];

    const usernames = matches.map((m) => m[1].toLowerCase());

    // Try to find users by email prefix (before @) or by firstName
    // This is a simple implementation - in production you might want a dedicated username field
    const users = await User.find({
      tenantId,
      deletedAt: null,
      $or: [
        { email: { $in: usernames.map((u) => new RegExp(`^${u}@`, 'i')) } },
        { firstName: { $in: usernames.map((u) => new RegExp(`^${u}$`, 'i')) } },
      ],
    })
      .select('_id email')
      .exec();

    return users.map((u) => ({ _id: u._id.toString(), email: u.email }));
  }
}
