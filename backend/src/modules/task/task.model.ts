import { Schema, model, Types } from 'mongoose';
import { applyBaseSchema, BaseDocument } from '@infrastructure/database/mongodb/baseModel';
import { TaskPriority } from '../../types';
import { IStatusDocument } from '../status/status.model';

export interface ITask extends BaseDocument {
  title: string;
  description?: string;
  projectId: string;
  assigneeId?: string;
  reporterId: string; // Who created it
  status: Types.ObjectId; // Reference to Status collection
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
}

/** Task with populated status details */
export interface ITaskWithStatus extends Omit<ITask, 'status'> {
  status: IStatusDocument;
}

const taskSchema = new Schema<ITask>({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  projectId: { type: String, required: true },
  assigneeId: { type: String },
  reporterId: { type: String, required: true },
  status: {
    type: Schema.Types.ObjectId,
    ref: 'Status',
    required: true,
    // No default - must be set from tenant's default status in service layer
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

// Virtual for populated status details
taskSchema.virtual('statusDetails', {
  ref: 'Status',
  localField: 'status',
  foreignField: '_id',
  justOne: true,
});

// Enable virtuals in JSON serialization
taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

// Compound indexes for the most common query patterns
taskSchema.index({ tenantId: 1, projectId: 1, status: 1 }); // List tasks in project by status
taskSchema.index({ tenantId: 1, assigneeId: 1, status: 1 }); // My tasks
taskSchema.index({ tenantId: 1, dueDate: 1 }); // Upcoming deadlines
taskSchema.index({ tenantId: 1, priority: 1, status: 1 }); // Priority queue view

export const Task = model<ITask>('Task', taskSchema);
