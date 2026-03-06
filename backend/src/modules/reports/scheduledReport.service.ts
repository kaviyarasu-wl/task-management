import { parseExpression } from 'cron-parser';
import { RequestContext } from '@core/context/RequestContext';
import { NotFoundError, BadRequestError } from '@core/errors/AppError';
import {
  ScheduledReportRepository,
  CreateScheduledReportData,
  UpdateScheduledReportData,
} from './scheduledReport.repository';
import {
  IScheduledReport,
  ScheduledReportType,
  ReportFormat,
  IScheduledReportFilters,
  DateRangePreset,
} from './scheduledReport.model';
import { ReportsService } from './reports.service';
import {
  exportTaskMetricsCSV,
  exportUserProductivityCSV,
  exportTeamWorkloadCSV,
  exportProjectSummaryCSV,
  exportVelocityCSV,
} from './export/csv.exporter';
import { exportToJSON } from './export/json.exporter';
import {
  exportTaskMetricsPDF,
  exportUserProductivityPDF,
  exportTeamWorkloadPDF,
  exportProjectSummaryPDF,
  exportVelocityPDF,
} from './export/pdf.generator';
import {
  exportTaskMetricsExcel,
  exportUserProductivityExcel,
  exportTeamWorkloadExcel,
  exportProjectSummaryExcel,
  exportVelocityExcel,
} from './export/excel.generator';
import { emailQueue } from '@infrastructure/queue/queues';
import type { TaskMetrics, UserProductivity, TeamWorkload, ProjectSummary, VelocityReport, DateRange } from './reports.types';

export interface CreateScheduledReportDTO {
  name: string;
  reportType: ScheduledReportType;
  format?: ReportFormat;
  cronExpression: string;
  timezone?: string;
  recipients: string[];
  filters?: IScheduledReportFilters;
}

export interface UpdateScheduledReportDTO {
  name?: string;
  cronExpression?: string;
  timezone?: string;
  recipients?: string[];
  filters?: IScheduledReportFilters;
  isActive?: boolean;
}

export interface GeneratedReport {
  content: string | Buffer;
  filename: string;
  mimeType: string;
}

export class ScheduledReportService {
  private readonly repo: ScheduledReportRepository;
  private readonly reportsService: ReportsService;

  constructor() {
    this.repo = new ScheduledReportRepository();
    this.reportsService = new ReportsService();
  }

  /**
   * List all scheduled reports for the current tenant
   */
  async list(): Promise<IScheduledReport[]> {
    const { tenantId } = RequestContext.get();
    return this.repo.findAll(tenantId);
  }

  /**
   * Get a scheduled report by ID
   */
  async getById(reportId: string): Promise<IScheduledReport> {
    const { tenantId } = RequestContext.get();
    const report = await this.repo.findById(tenantId, reportId);
    if (!report) {
      throw new NotFoundError('ScheduledReport');
    }
    return report;
  }

  /**
   * Create a new scheduled report
   */
  async create(data: CreateScheduledReportDTO): Promise<IScheduledReport> {
    const { tenantId, userId } = RequestContext.get();

    // Validate cron expression and calculate next run
    const nextRunAt = this.calculateNextRun(data.cronExpression, data.timezone || 'UTC');

    // Validate recipients
    for (const email of data.recipients) {
      if (!this.isValidEmail(email)) {
        throw new BadRequestError(`Invalid email address: ${email}`);
      }
    }

    const createData: CreateScheduledReportData = {
      tenantId,
      name: data.name,
      reportType: data.reportType,
      format: data.format || 'csv',
      cronExpression: data.cronExpression,
      timezone: data.timezone || 'UTC',
      recipients: data.recipients,
      filters: data.filters,
      nextRunAt,
      createdBy: userId,
    };

    return this.repo.create(createData);
  }

  /**
   * Update an existing scheduled report
   */
  async update(reportId: string, data: UpdateScheduledReportDTO): Promise<IScheduledReport> {
    const { tenantId } = RequestContext.get();

    const existing = await this.repo.findById(tenantId, reportId);
    if (!existing) {
      throw new NotFoundError('ScheduledReport');
    }

    const updateData: UpdateScheduledReportData = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.recipients !== undefined) {
      for (const email of data.recipients) {
        if (!this.isValidEmail(email)) {
          throw new BadRequestError(`Invalid email address: ${email}`);
        }
      }
      updateData.recipients = data.recipients;
    }

    if (data.filters !== undefined) {
      updateData.filters = data.filters;
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    // If cron or timezone changes, recalculate next run
    if (data.cronExpression !== undefined || data.timezone !== undefined) {
      const cronExpression = data.cronExpression || existing.cronExpression;
      const timezone = data.timezone || existing.timezone;
      updateData.nextRunAt = this.calculateNextRun(cronExpression, timezone);

      if (data.cronExpression !== undefined) {
        updateData.cronExpression = data.cronExpression;
      }
      if (data.timezone !== undefined) {
        updateData.timezone = data.timezone;
      }
    }

    const updated = await this.repo.update(tenantId, reportId, updateData);
    if (!updated) {
      throw new NotFoundError('ScheduledReport');
    }
    return updated;
  }

  /**
   * Delete a scheduled report (soft delete)
   */
  async delete(reportId: string): Promise<void> {
    const { tenantId } = RequestContext.get();
    const deleted = await this.repo.softDelete(tenantId, reportId);
    if (!deleted) {
      throw new NotFoundError('ScheduledReport');
    }
  }

  /**
   * Get all due scheduled reports (for processor)
   */
  async getDueReports(): Promise<IScheduledReport[]> {
    return this.repo.findDue();
  }

  /**
   * Process a scheduled report - generate and send via email
   */
  async processScheduledReport(report: IScheduledReport): Promise<void> {
    try {
      // Generate report within the report's tenant context
      const { content, filename, mimeType } = await RequestContext.run(
        {
          tenantId: report.tenantId,
          userId: report.createdBy.toString(),
          email: 'system@scheduled-report.internal',
          role: 'admin',
          requestId: `scheduled-report-${report._id}-${Date.now()}`,
          locale: 'en',
        },
        () => this.generateReport(report)
      );

      // Send email with attachment to all recipients
      for (const recipient of report.recipients) {
        await emailQueue.add(
          'send-scheduled-report',
          {
            to: recipient,
            subject: `Scheduled Report: ${report.name}`,
            templateId: 'scheduled-report',
            variables: {
              reportName: report.name,
              reportType: this.formatReportType(report.reportType),
              generatedAt: new Date().toISOString(),
            },
            attachment: {
              filename,
              content: Buffer.isBuffer(content)
                ? content.toString('base64')
                : Buffer.from(content).toString('base64'),
              encoding: 'base64',
              contentType: mimeType,
            },
          },
          {
            jobId: `scheduled-report-${report._id}-${recipient}-${Date.now()}`,
          }
        );
      }

      // Update report status
      const nextRunAt = this.calculateNextRun(report.cronExpression, report.timezone);
      await this.repo.updateAfterRun(report._id.toString(), nextRunAt, 'success');
    } catch (error) {
      // Update report status with error
      const nextRunAt = this.calculateNextRun(report.cronExpression, report.timezone);
      await this.repo.updateAfterRun(
        report._id.toString(),
        nextRunAt,
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  /**
   * Generate report content based on report type
   */
  async generateReport(report: IScheduledReport): Promise<GeneratedReport> {
    const dateRange = this.resolveDateRange(report.filters?.dateRange);
    const filters = {
      projectId: report.filters?.projectId,
      startDate: dateRange?.start,
      endDate: dateRange?.end,
    };

    const timestamp = new Date().toISOString().split('T')[0];
    const mimeType = this.resolveMimeType(report.format);
    const extension = report.format === 'xlsx' ? 'xlsx' : report.format;

    let content: string | Buffer;
    let filename: string;

    switch (report.reportType) {
      case 'task-metrics': {
        const taskMetrics = await this.reportsService.getTaskMetrics(filters);
        content = await this.formatReportContent(
          report.format,
          () => exportTaskMetricsCSV(taskMetrics),
          () => exportToJSON(taskMetrics, { reportType: 'task-metrics' }, { prettyPrint: true }),
          () => exportTaskMetricsPDF(taskMetrics),
          () => exportTaskMetricsExcel(taskMetrics)
        );
        filename = `task-metrics-${timestamp}.${extension}`;
        break;
      }

      case 'user-productivity': {
        const productivity = await this.reportsService.getUserProductivity(dateRange);
        content = await this.formatReportContent(
          report.format,
          () => exportUserProductivityCSV(productivity),
          () => exportToJSON(productivity, undefined, { prettyPrint: true }),
          () => exportUserProductivityPDF(productivity),
          () => exportUserProductivityExcel(productivity)
        );
        filename = `user-productivity-${timestamp}.${extension}`;
        break;
      }

      case 'team-workload': {
        const workload = await this.reportsService.getTeamWorkload();
        content = await this.formatReportContent(
          report.format,
          () => exportTeamWorkloadCSV(workload),
          () => exportToJSON(workload, undefined, { prettyPrint: true }),
          () => exportTeamWorkloadPDF(workload),
          () => exportTeamWorkloadExcel(workload)
        );
        filename = `team-workload-${timestamp}.${extension}`;
        break;
      }

      case 'project-summary': {
        const projectSummaries = await this.reportsService.getProjectSummaries();
        content = await this.formatReportContent(
          report.format,
          () => exportProjectSummaryCSV(projectSummaries),
          () => exportToJSON(projectSummaries, undefined, { prettyPrint: true }),
          () => exportProjectSummaryPDF(projectSummaries),
          () => exportProjectSummaryExcel(projectSummaries)
        );
        filename = `project-summary-${timestamp}.${extension}`;
        break;
      }

      case 'velocity': {
        const velocityReport = await this.reportsService.getVelocityReport('weekly');
        content = await this.formatReportContent(
          report.format,
          () => exportVelocityCSV(velocityReport),
          () => exportToJSON(velocityReport, undefined, { prettyPrint: true }),
          () => exportVelocityPDF(velocityReport),
          () => exportVelocityExcel(velocityReport)
        );
        filename = `velocity-${timestamp}.${extension}`;
        break;
      }

      default:
        throw new BadRequestError(`Unsupported report type: ${report.reportType}`);
    }

    return { content, filename, mimeType };
  }

  private async formatReportContent(
    format: string,
    csvFn: () => string,
    jsonFn: () => string,
    pdfFn: () => Promise<Buffer>,
    excelFn: () => Promise<Buffer>
  ): Promise<string | Buffer> {
    switch (format) {
      case 'pdf':
        return pdfFn();
      case 'xlsx':
        return excelFn();
      case 'json':
        return jsonFn();
      default:
        return csvFn();
    }
  }

  private resolveMimeType(format: string): string {
    switch (format) {
      case 'pdf':
        return 'application/pdf';
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'json':
        return 'application/json';
      default:
        return 'text/csv';
    }
  }

  /**
   * Calculate the next run time based on cron expression
   */
  private calculateNextRun(cronExpression: string, timezone: string): Date {
    try {
      const options = { currentDate: new Date(), tz: timezone };
      const interval = parseExpression(cronExpression, options);
      return interval.next().toDate();
    } catch (error) {
      throw new BadRequestError(
        `Invalid cron expression: ${cronExpression}. ${error instanceof Error ? error.message : ''}`
      );
    }
  }

  /**
   * Resolve date range preset to actual dates
   */
  private resolveDateRange(preset?: DateRangePreset): DateRange | undefined {
    if (!preset) return undefined;

    const now = new Date();
    const end = new Date(now);
    const start = new Date(now);

    switch (preset) {
      case 'last_7_days':
        start.setDate(start.getDate() - 7);
        break;
      case 'last_30_days':
        start.setDate(start.getDate() - 30);
        break;
      case 'this_month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'last_month':
        start.setMonth(start.getMonth() - 1);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setDate(0); // Last day of previous month
        end.setHours(23, 59, 59, 999);
        break;
      default:
        return undefined;
    }

    return { start, end };
  }

  /**
   * Format report type for display
   */
  private formatReportType(type: ScheduledReportType): string {
    return type
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Validate email address format
   */
  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
