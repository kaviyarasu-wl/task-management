import { Schema, model, Types } from 'mongoose';
import { applyBaseSchema, BaseDocument } from '@infrastructure/database/mongodb/baseModel';

export interface ICommentAttachment {
  uploadId: Types.ObjectId;
  filename: string;
  url: string;
  mimetype: string;
  size: number;
}

export interface IComment extends BaseDocument {
  taskId: Types.ObjectId;
  authorId: Types.ObjectId;
  content: string;
  mentions: Types.ObjectId[];
  editedAt?: Date;
  parentId?: Types.ObjectId; // For threaded replies
  attachments: ICommentAttachment[];
}

const commentSchema = new Schema<IComment>({
  taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 5000 },
  mentions: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  editedAt: { type: Date },
  parentId: { type: Schema.Types.ObjectId, ref: 'Comment' },
  attachments: {
    type: [
      {
        uploadId: { type: Schema.Types.ObjectId, ref: 'Upload', required: true },
        filename: { type: String, required: true },
        url: { type: String, required: true },
        mimetype: { type: String, required: true },
        size: { type: Number, required: true },
      },
    ],
    default: [],
  },
});

applyBaseSchema(commentSchema);

// Most common query: get comments for a task in chronological order
commentSchema.index({ tenantId: 1, taskId: 1, createdAt: -1 });
// For threaded replies
commentSchema.index({ tenantId: 1, parentId: 1, createdAt: 1 });

// Full-text search index
commentSchema.index({ content: 'text' }, { name: 'comment_text_search' });

export const Comment = model<IComment>('Comment', commentSchema);
