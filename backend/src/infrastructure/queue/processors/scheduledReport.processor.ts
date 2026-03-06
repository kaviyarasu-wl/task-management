import { Job } from 'bullmq';
import { ScheduledReportService } from '@modules/reports/scheduledReport.service';
import { createLogger } from '@infrastructure/logger';

const log = createLogger('ScheduledReportProcessor');

/**
 * Scheduled report processor — processes due scheduled reports.
 * Runs on a schedule and finds all reports that are due to be generated and sent.
 */
export async function scheduledReportProcessor(job: Job): Promise<void> {
  log.info({ jobId: job.id }, 'Starting scheduled report check');

  const scheduledReportService = new ScheduledReportService();
  const dueReports = await scheduledReportService.getDueReports();

  log.info({ jobId: job.id, dueCount: dueReports.length }, 'Found due reports');

  let successCount = 0;
  let errorCount = 0;

  for (const report of dueReports) {
    try {
      await scheduledReportService.processScheduledReport(report);
      successCount++;
      log.info({ reportId: report._id, reportName: report.name }, 'Processed report');
    } catch (error) {
      errorCount++;
      log.error(
        { err: error, reportId: report._id, reportName: report.name },
        'Failed to process report'
      );
    }
  }

  log.info({ jobId: job.id, successCount, errorCount }, 'Scheduled report check completed');
}
