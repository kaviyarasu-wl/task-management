import { Schema, model, Types } from 'mongoose';
import { applyBaseSchema, BaseDocument } from '@infrastructure/database/mongodb/baseModel';

export type ReportFormat = 'csv' | 'json' | 'pdf' | 'xlsx';
export type ScheduledReportType =
  | 'task-metrics'
  | 'user-productivity'
  | 'team-workload'
  | 'project-summary'
  | 'velocity';
export type RunStatus = 'success' | 'failed';
export type DateRangePreset = 'last_7_days' | 'last_30_days' | 'this_month' | 'last_month';

export interface IScheduledReportFilters {
  projectId?: string;
  dateRange?: DateRangePreset;
}

export interface IScheduledReport extends BaseDocument {
  name: string;
  reportType: ScheduledReportType;
  format: ReportFormat;
  cronExpression: string;
  timezone: string;
  recipients: string[];
  filters?: IScheduledReportFilters;
  isActive: boolean;
  nextRunAt: Date;
  lastRunAt?: Date;
  lastRunStatus?: RunStatus;
  lastError?: string;
  createdBy: Types.ObjectId;
}

const scheduledReportSchema = new Schema<IScheduledReport>({
  name: {
    type: String,
    required: true,
    maxlength: 100,
  },
  reportType: {
    type: String,
    enum: ['task-metrics', 'user-productivity', 'team-workload', 'project-summary', 'velocity'],
    required: true,
  },
  format: {
    type: String,
    enum: ['csv', 'json', 'pdf', 'xlsx'],
    default: 'csv',
  },
  cronExpression: {
    type: String,
    required: true,
  },
  timezone: {
    type: String,
    default: 'UTC',
  },
  recipients: {
    type: [String],
    required: true,
    validate: {
      validator: (v: string[]) => v.length > 0 && v.length <= 10,
      message: 'Recipients must have 1-10 email addresses',
    },
  },
  filters: {
    projectId: { type: String },
    dateRange: {
      type: String,
      enum: ['last_7_days', 'last_30_days', 'this_month', 'last_month'],
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  nextRunAt: {
    type: Date,
    required: true,
  },
  lastRunAt: {
    type: Date,
  },
  lastRunStatus: {
    type: String,
    enum: ['success', 'failed'],
  },
  lastError: {
    type: String,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

applyBaseSchema(scheduledReportSchema);

// Index for finding due reports efficiently
scheduledReportSchema.index({ isActive: 1, nextRunAt: 1, deletedAt: 1 });
// Index for listing reports by tenant
scheduledReportSchema.index({ tenantId: 1, createdAt: -1 });
// Index for finding reports by creator
scheduledReportSchema.index({ tenantId: 1, createdBy: 1 });

export const ScheduledReport = model<IScheduledReport>('ScheduledReport', scheduledReportSchema);
