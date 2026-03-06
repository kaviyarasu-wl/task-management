import { Job } from 'bullmq';
import { ExportJobData, emailQueue } from '../queues';
import { reportsService } from '@modules/reports/reports.service';
import {
  exportTaskMetricsPDF,
  exportUserProductivityPDF,
  exportTeamWorkloadPDF,
  exportProjectSummaryPDF,
  exportVelocityPDF,
} from '@modules/reports/export/pdf.generator';
import {
  exportTaskMetricsExcel,
  exportUserProductivityExcel,
  exportTeamWorkloadExcel,
  exportProjectSummaryExcel,
  exportVelocityExcel,
} from '@modules/reports/export/excel.generator';
import { RequestContext } from '@core/context/RequestContext';
import { createLogger } from '@infrastructure/logger';
import { randomUUID } from 'crypto';
import type { DateRange, VelocityPeriod } from '@modules/reports/reports.types';

const log = createLogger('ExportProcessor');

/**
 * Export processor — generates PDF/Excel reports asynchronously
 * and emails the result to the requesting user.
 */
export async function exportProcessor(job: Job<ExportJobData>): Promise<void> {
  const { tenantId, userId, reportType, format, filters, dateRange, recipientEmail } =
    job.data;

  log.info({ jobId: job.id, reportType, format, recipientEmail }, 'Processing export job');

  await RequestContext.run(
    {
      tenantId,
      userId,
      email: recipientEmail,
      role: 'member',
      requestId: randomUUID(),
      locale: 'en',
    },
    async () => {
      const { buffer, filename, contentType } = await generateReport(
        reportType,
        format,
        filters,
        dateRange
      );

      await emailQueue.add('export-ready', {
        to: recipientEmail,
        subject: `Your ${formatReportName(reportType)} export is ready`,
        templateId: 'scheduled-report',
        variables: {
          reportType: formatReportName(reportType),
          format: format.toUpperCase(),
        },
        attachment: {
          filename,
          content: buffer.toString('base64'),
          encoding: 'base64',
          contentType,
        },
      });

      log.info(
        { jobId: job.id, reportType, format, recipientEmail, fileSize: buffer.length },
        'Export completed and email queued'
      );
    }
  );
}

interface GeneratedExport {
  buffer: Buffer;
  filename: string;
  contentType: string;
}

async function generateReport(
  reportType: string,
  format: string,
  filters?: Record<string, unknown>,
  dateRange?: { start: string; end: string }
): Promise<GeneratedExport> {
  const isPDF = format === 'pdf';
  const extension = isPDF ? 'pdf' : 'xlsx';
  const contentType = isPDF
    ? 'application/pdf'
    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  const metricFilters = filters
    ? {
        projectId: filters.projectId as string | undefined,
        startDate: filters.startDate ? new Date(filters.startDate as string) : undefined,
        endDate: filters.endDate ? new Date(filters.endDate as string) : undefined,
      }
    : undefined;

  const parsedDateRange: DateRange | undefined = dateRange
    ? { start: new Date(dateRange.start), end: new Date(dateRange.end) }
    : undefined;

  let buffer: Buffer;

  switch (reportType) {
    case 'task-metrics': {
      const data = await reportsService.getTaskMetrics(metricFilters);
      buffer = isPDF
        ? await exportTaskMetricsPDF(data)
        : await exportTaskMetricsExcel(data);
      break;
    }
    case 'user-productivity': {
      const data = await reportsService.getUserProductivity(parsedDateRange);
      buffer = isPDF
        ? await exportUserProductivityPDF(data)
        : await exportUserProductivityExcel(data);
      break;
    }
    case 'team-workload': {
      const data = await reportsService.getTeamWorkload();
      buffer = isPDF
        ? await exportTeamWorkloadPDF(data)
        : await exportTeamWorkloadExcel(data);
      break;
    }
    case 'project-summary': {
      const data = await reportsService.getProjectSummaries();
      buffer = isPDF
        ? await exportProjectSummaryPDF(data)
        : await exportProjectSummaryExcel(data);
      break;
    }
    case 'velocity': {
      const data = await reportsService.getVelocityReport(
        'weekly' as VelocityPeriod,
        parsedDateRange
      );
      buffer = isPDF
        ? await exportVelocityPDF(data)
        : await exportVelocityExcel(data);
      break;
    }
    default:
      throw new Error(`Unsupported report type: ${reportType}`);
  }

  return {
    buffer,
    filename: `${reportType}.${extension}`,
    contentType,
  };
}

function formatReportName(reportType: string): string {
  return reportType
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
