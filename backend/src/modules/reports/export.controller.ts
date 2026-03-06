import { Request, Response } from 'express';
import { reportsService } from './reports.service';
import { ScheduledReportService } from './scheduledReport.service';
import { exportService } from './export/export.service';
import {
  exportQuerySchema,
  scheduledReportCreateSchema,
  scheduledReportUpdateSchema,
  scheduledReportIdSchema,
} from '@api/validators/export.validator';
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
import { RequestContext } from '@core/context/RequestContext';
import type { ExportFormat, ReportType } from './export/export.types';
import type { VelocityPeriod, MetricFilters, DateRange } from './reports.types';

const scheduledReportService = new ScheduledReportService();

/**
 * Send an async export response (202 Accepted) with the queued job ID.
 */
async function sendAsyncExportResponse(
  res: Response,
  reportType: ReportType,
  format: ExportFormat,
  filters?: MetricFilters,
  dateRange?: DateRange
): Promise<void> {
  const { email } = RequestContext.get();
  const jobId = await exportService.queueExport({
    reportType,
    format,
    filters,
    dateRange,
    recipientEmail: email,
  });

  res.status(202).json({
    success: true,
    data: {
      jobId,
      message: 'Export is being generated. You will receive an email when ready.',
    },
  });
}

export const exportController = {
  // ============================================
  // Export endpoints (download files)
  // ============================================

  /**
   * GET /export/task-metrics
   * Export task metrics as CSV, JSON, PDF, or Excel
   */
  async exportTaskMetrics(req: Request, res: Response): Promise<void> {
    const { format, projectId, start, end, async: forceAsync } =
      exportQuerySchema.parse(req.query);

    const filters: MetricFilters = {
      projectId,
      startDate: start ? new Date(start) : undefined,
      endDate: end ? new Date(end) : undefined,
    };

    // Check if async processing is needed for PDF/Excel
    if (
      (format === 'pdf' || format === 'xlsx') &&
      (await exportService.shouldProcessAsync('task-metrics', forceAsync, filters))
    ) {
      await sendAsyncExportResponse(res, 'task-metrics', format, filters);
      return;
    }

    const data = await reportsService.getTaskMetrics(filters);

    switch (format) {
      case 'pdf': {
        const pdfBuffer = await exportTaskMetricsPDF(data);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="task-metrics.pdf"');
        res.send(pdfBuffer);
        break;
      }
      case 'xlsx': {
        const excelBuffer = await exportTaskMetricsExcel(data);
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
          'Content-Disposition',
          'attachment; filename="task-metrics.xlsx"'
        );
        res.send(excelBuffer);
        break;
      }
      case 'json': {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader(
          'Content-Disposition',
          'attachment; filename="task-metrics.json"'
        );
        res.send(exportToJSON(data, undefined, { prettyPrint: true }));
        break;
      }
      default: {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
          'Content-Disposition',
          'attachment; filename="task-metrics.csv"'
        );
        res.send(exportTaskMetricsCSV(data));
      }
    }
  },

  /**
   * GET /export/user-productivity
   * Export user productivity as CSV, JSON, PDF, or Excel (admin/owner only)
   */
  async exportUserProductivity(req: Request, res: Response): Promise<void> {
    const { format, start, end, async: forceAsync } = exportQuerySchema.parse(
      req.query
    );

    const dateRange: DateRange | undefined =
      start && end ? { start: new Date(start), end: new Date(end) } : undefined;

    if (
      (format === 'pdf' || format === 'xlsx') &&
      (await exportService.shouldProcessAsync('user-productivity', forceAsync))
    ) {
      await sendAsyncExportResponse(
        res,
        'user-productivity',
        format,
        undefined,
        dateRange
      );
      return;
    }

    const data = await reportsService.getUserProductivity(dateRange);

    switch (format) {
      case 'pdf': {
        const pdfBuffer = await exportUserProductivityPDF(data);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          'attachment; filename="user-productivity.pdf"'
        );
        res.send(pdfBuffer);
        break;
      }
      case 'xlsx': {
        const excelBuffer = await exportUserProductivityExcel(data);
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
          'Content-Disposition',
          'attachment; filename="user-productivity.xlsx"'
        );
        res.send(excelBuffer);
        break;
      }
      case 'json': {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader(
          'Content-Disposition',
          'attachment; filename="user-productivity.json"'
        );
        res.send(exportToJSON(data, undefined, { prettyPrint: true }));
        break;
      }
      default: {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
          'Content-Disposition',
          'attachment; filename="user-productivity.csv"'
        );
        res.send(exportUserProductivityCSV(data));
      }
    }
  },

  /**
   * GET /export/team-workload
   * Export team workload as CSV, JSON, PDF, or Excel (admin/owner only)
   */
  async exportTeamWorkload(req: Request, res: Response): Promise<void> {
    const { format, async: forceAsync } = exportQuerySchema.parse(req.query);

    if (
      (format === 'pdf' || format === 'xlsx') &&
      (await exportService.shouldProcessAsync('team-workload', forceAsync))
    ) {
      await sendAsyncExportResponse(res, 'team-workload', format);
      return;
    }

    const data = await reportsService.getTeamWorkload();

    switch (format) {
      case 'pdf': {
        const pdfBuffer = await exportTeamWorkloadPDF(data);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          'attachment; filename="team-workload.pdf"'
        );
        res.send(pdfBuffer);
        break;
      }
      case 'xlsx': {
        const excelBuffer = await exportTeamWorkloadExcel(data);
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
          'Content-Disposition',
          'attachment; filename="team-workload.xlsx"'
        );
        res.send(excelBuffer);
        break;
      }
      case 'json': {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader(
          'Content-Disposition',
          'attachment; filename="team-workload.json"'
        );
        res.send(exportToJSON(data, undefined, { prettyPrint: true }));
        break;
      }
      default: {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
          'Content-Disposition',
          'attachment; filename="team-workload.csv"'
        );
        res.send(exportTeamWorkloadCSV(data));
      }
    }
  },

  /**
   * GET /export/project-summary
   * Export project summary as CSV, JSON, PDF, or Excel
   */
  async exportProjectSummary(req: Request, res: Response): Promise<void> {
    const { format, async: forceAsync } = exportQuerySchema.parse(req.query);

    if (
      (format === 'pdf' || format === 'xlsx') &&
      (await exportService.shouldProcessAsync('project-summary', forceAsync))
    ) {
      await sendAsyncExportResponse(res, 'project-summary', format);
      return;
    }

    const data = await reportsService.getProjectSummaries();

    switch (format) {
      case 'pdf': {
        const pdfBuffer = await exportProjectSummaryPDF(data);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          'attachment; filename="project-summary.pdf"'
        );
        res.send(pdfBuffer);
        break;
      }
      case 'xlsx': {
        const excelBuffer = await exportProjectSummaryExcel(data);
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
          'Content-Disposition',
          'attachment; filename="project-summary.xlsx"'
        );
        res.send(excelBuffer);
        break;
      }
      case 'json': {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader(
          'Content-Disposition',
          'attachment; filename="project-summary.json"'
        );
        res.send(exportToJSON(data, undefined, { prettyPrint: true }));
        break;
      }
      default: {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
          'Content-Disposition',
          'attachment; filename="project-summary.csv"'
        );
        res.send(exportProjectSummaryCSV(data));
      }
    }
  },

  /**
   * GET /export/velocity
   * Export velocity report as CSV, JSON, PDF, or Excel
   */
  async exportVelocity(req: Request, res: Response): Promise<void> {
    const { format, start, end, async: forceAsync } = exportQuerySchema.parse(
      req.query
    );

    const dateRange: DateRange | undefined =
      start && end ? { start: new Date(start), end: new Date(end) } : undefined;

    if (
      (format === 'pdf' || format === 'xlsx') &&
      (await exportService.shouldProcessAsync('velocity', forceAsync))
    ) {
      await sendAsyncExportResponse(
        res,
        'velocity',
        format,
        undefined,
        dateRange
      );
      return;
    }

    const data = await reportsService.getVelocityReport(
      'weekly' as VelocityPeriod,
      dateRange
    );

    switch (format) {
      case 'pdf': {
        const pdfBuffer = await exportVelocityPDF(data);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          'attachment; filename="velocity.pdf"'
        );
        res.send(pdfBuffer);
        break;
      }
      case 'xlsx': {
        const excelBuffer = await exportVelocityExcel(data);
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
          'Content-Disposition',
          'attachment; filename="velocity.xlsx"'
        );
        res.send(excelBuffer);
        break;
      }
      case 'json': {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader(
          'Content-Disposition',
          'attachment; filename="velocity.json"'
        );
        res.send(exportToJSON(data, undefined, { prettyPrint: true }));
        break;
      }
      default: {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
          'Content-Disposition',
          'attachment; filename="velocity.csv"'
        );
        res.send(exportVelocityCSV(data));
      }
    }
  },

  // ============================================
  // Scheduled report CRUD (admin/owner only)
  // ============================================

  /**
   * GET /export/scheduled
   * List all scheduled reports for the tenant
   */
  async listScheduledReports(_req: Request, res: Response): Promise<void> {
    const reports = await scheduledReportService.list();
    res.json({ success: true, data: reports });
  },

  /**
   * GET /export/scheduled/:id
   * Get a specific scheduled report
   */
  async getScheduledReport(req: Request, res: Response): Promise<void> {
    const { id } = scheduledReportIdSchema.parse(req.params);
    const report = await scheduledReportService.getById(id);
    res.json({ success: true, data: report });
  },

  /**
   * POST /export/scheduled
   * Create a new scheduled report
   */
  async createScheduledReport(req: Request, res: Response): Promise<void> {
    const data = scheduledReportCreateSchema.parse(req.body);
    const report = await scheduledReportService.create(data);
    res.status(201).json({ success: true, data: report });
  },

  /**
   * PATCH /export/scheduled/:id
   * Update a scheduled report
   */
  async updateScheduledReport(req: Request, res: Response): Promise<void> {
    const { id } = scheduledReportIdSchema.parse(req.params);
    const data = scheduledReportUpdateSchema.parse(req.body);
    const report = await scheduledReportService.update(id, data);
    res.json({ success: true, data: report });
  },

  /**
   * DELETE /export/scheduled/:id
   * Delete a scheduled report
   */
  async deleteScheduledReport(req: Request, res: Response): Promise<void> {
    const { id } = scheduledReportIdSchema.parse(req.params);
    await scheduledReportService.delete(id);
    res.json({ success: true, message: 'Scheduled report deleted' });
  },
};
