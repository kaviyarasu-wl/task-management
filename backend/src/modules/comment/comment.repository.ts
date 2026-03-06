import { Types } from 'mongoose';
import { Comment, IComment } from './comment.model';
import { PaginatedResult, PaginationQuery } from '../../types';

export interface CommentFilters {
  parentId?: string | null; // null for top-level comments only
}

export interface PopulateOptions {
  author?: boolean;
  mentions?: boolean;
}

export class CommentRepository {
  async findById(
    tenantId: string,
    commentId: string,
    options?: PopulateOptions
  ): Promise<IComment | null> {
    let queryBuilder = Comment.findOne({ _id: commentId, tenantId, deletedAt: null });

    if (options?.author) {
      queryBuilder = queryBuilder.populate('authorId', 'firstName lastName email');
    }
    if (options?.mentions) {
      queryBuilder = queryBuilder.populate('mentions', 'firstName lastName email');
    }

    return queryBuilder.exec();
  }

  async findByTask(
    tenantId: string,
    taskId: string,
    filters: CommentFilters,
    query: PaginationQuery,
    options?: PopulateOptions
  ): Promise<PaginatedResult<IComment>> {
    const limit = Math.min(query.limit ?? 20, 100);
    const filter: Record<string, unknown> = { tenantId, taskId, deletedAt: null };

    // Filter by parentId for threaded comments
    if (filters.parentId === null) {
      filter['parentId'] = { $exists: false };
    } else if (filters.parentId) {
      filter['parentId'] = filters.parentId;
    }

    if (query.cursor) {
      filter['_id'] = { $lt: query.cursor };
    }

    let queryBuilder = Comment.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1);

    if (options?.author) {
      queryBuilder = queryBuilder.populate('authorId', 'firstName lastName email');
    }
    if (options?.mentions) {
      queryBuilder = queryBuilder.populate('mentions', 'firstName lastName email');
    }

    const data = await queryBuilder.exec();

    const hasMore = data.length > limit;
    if (hasMore) data.pop();

    const total = await Comment.countDocuments({ tenantId, taskId, deletedAt: null }).exec();

    return {
      data,
      nextCursor: hasMore ? data[data.length - 1]._id?.toString() ?? null : null,
      total,
    };
  }

  async create(data: {
    tenantId: string;
    taskId: string;
    authorId: string;
    content: string;
    mentions?: string[];
    parentId?: string;
  }): Promise<IComment> {
    const comment = new Comment({
      tenantId: data.tenantId,
      taskId: new Types.ObjectId(data.taskId),
      authorId: new Types.ObjectId(data.authorId),
      content: data.content,
      mentions: data.mentions?.map((id) => new Types.ObjectId(id)) ?? [],
      parentId: data.parentId ? new Types.ObjectId(data.parentId) : undefined,
    });
    return comment.save();
  }

  async update(
    tenantId: string,
    commentId: string,
    data: { content: string; mentions?: string[] }
  ): Promise<IComment | null> {
    const updateData: Record<string, unknown> = {
      content: data.content,
      editedAt: new Date(),
    };

    if (data.mentions) {
      updateData['mentions'] = data.mentions.map((id) => new Types.ObjectId(id));
    }

    return Comment.findOneAndUpdate(
      { _id: commentId, tenantId, deletedAt: null },
      { $set: updateData },
      { new: true }
    ).exec();
  }

  async softDelete(tenantId: string, commentId: string): Promise<boolean> {
    const result = await Comment.findOneAndUpdate(
      { _id: commentId, tenantId, deletedAt: null },
      { deletedAt: new Date() }
    ).exec();
    return result !== null;
  }

  async countByTask(tenantId: string, taskId: string): Promise<number> {
    return Comment.countDocuments({ tenantId, taskId, deletedAt: null }).exec();
  }

  async addAttachment(
    tenantId: string,
    commentId: string,
    attachment: {
      uploadId: Types.ObjectId;
      filename: string;
      url: string;
      mimetype: string;
      size: number;
    }
  ): Promise<IComment | null> {
    return Comment.findOneAndUpdate(
      { _id: commentId, tenantId, deletedAt: null },
      { $push: { attachments: attachment } },
      { new: true }
    ).exec();
  }

  async removeAttachment(
    tenantId: string,
    commentId: string,
    uploadId: string
  ): Promise<IComment | null> {
    return Comment.findOneAndUpdate(
      { _id: commentId, tenantId, deletedAt: null },
      { $pull: { attachments: { uploadId: new Types.ObjectId(uploadId) } } },
      { new: true }
    ).exec();
  }
}
