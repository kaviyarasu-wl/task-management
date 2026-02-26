import { Schema, model } from 'mongoose';
import { applyBaseSchema, BaseDocument } from '@infrastructure/database/mongodb/baseModel';
import { TaskPriority, TaskStatus } from '../../types';

export interface ITask extends BaseDocument {
  title: string;
  description?: string;
  projectId: string;
  assigneeId?: string;
  reporterId: string; // Who created it
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  completedAt?: Date;
  tags: string[];
  attachments: Array<{
    filename: string;
    url: string;
    uploadedAt: Date;
  }>;
  // Plugin system: tenant-specific custom fields stored as flexible map
  customFields: Map<string, unknown>;
  // Cursor pagination uses _id by default, but we also sort by dueDate
}

const taskSchema = new Schema<ITask>({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  projectId: { type: String, required: true },
  assigneeId: { type: String },
  reporterId: { type: String, required: true },
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'review', 'done', 'cancelled'],
    default: 'todo',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  dueDate: { type: Date },
  completedAt: { type: Date },
  tags: { type: [String], default: [] },
  attachments: {
    type: [
      {
        filename: { type: String, required: true },
        url: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  },
  customFields: { type: Map, of: Schema.Types.Mixed, default: {} },
});

applyBaseSchema(taskSchema);

// Compound indexes for the most common query patterns
taskSchema.index({ tenantId: 1, projectId: 1, status: 1 }); // List tasks in project by status
taskSchema.index({ tenantId: 1, assigneeId: 1, status: 1 }); // My tasks
taskSchema.index({ tenantId: 1, dueDate: 1 }); // Upcoming deadlines
taskSchema.index({ tenantId: 1, priority: 1, status: 1 }); // Priority queue view

export const Task = model<ITask>('Task', taskSchema);
