import { reportsService } from '../reports.service';
import { RequestContext } from '@core/context/RequestContext';
import { exportQueue } from '@infrastructure/queue/queues';
import type { ExportFormat, ReportType } from './export.types';
import type { MetricFilters, DateRange } from '../reports.types';

const ASYNC_THRESHOLD = 1000;

export class ExportService {
  /**
   * Determine if export should be processed asynchronously.
   * Large datasets are queued for background generation.
   */
  async shouldProcessAsync(
    reportType: ReportType,
    forceAsync: boolean,
    filters?: MetricFilters
  ): Promise<boolean> {
    if (forceAsync) return true;

    const metrics = await reportsService.getTaskMetrics(filters);
    return metrics.totalTasks > ASYNC_THRESHOLD;
  }

  /**
   * Queue an async export job. Returns job ID for status tracking.
   */
  async queueExport(params: {
    reportType: ReportType;
    format: ExportFormat;
    filters?: MetricFilters;
    dateRange?: DateRange;
    recipientEmail: string;
  }): Promise<string> {
    const { tenantId, userId } = RequestContext.get();

    const job = await exportQueue.add('generate-export', {
      tenantId,
      userId,
      reportType: params.reportType,
      format: params.format,
      filters: params.filters as Record<string, unknown> | undefined,
      dateRange: params.dateRange
        ? {
            start: params.dateRange.start.toISOString(),
            end: params.dateRange.end.toISOString(),
          }
        : undefined,
      recipientEmail: params.recipientEmail,
    });

    return job.id ?? 'unknown';
  }
}

export const exportService = new ExportService();
