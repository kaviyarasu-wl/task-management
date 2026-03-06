import { ScheduledReportService } from '../../src/modules/reports/scheduledReport.service';
import { ScheduledReportRepository } from '../../src/modules/reports/scheduledReport.repository';
import { ReportsService } from '../../src/modules/reports/reports.service';
import { RequestContext } from '../../src/core/context/RequestContext';
import { NotFoundError, BadRequestError } from '../../src/core/errors/AppError';

jest.mock('../../src/modules/reports/scheduledReport.repository');
jest.mock('../../src/modules/reports/reports.service');
jest.mock('../../src/modules/reports/export/csv.exporter', () => ({
  exportTaskMetricsCSV: jest.fn().mockReturnValue('csv-content'),
  exportUserProductivityCSV: jest.fn().mockReturnValue('csv-content'),
  exportTeamWorkloadCSV: jest.fn().mockReturnValue('csv-content'),
  exportProjectSummaryCSV: jest.fn().mockReturnValue('csv-content'),
  exportVelocityCSV: jest.fn().mockReturnValue('csv-content'),
}));
jest.mock('../../src/modules/reports/export/json.exporter', () => ({
  exportToJSON: jest.fn().mockReturnValue('{}'),
}));
jest.mock('../../src/modules/reports/export/pdf.generator', () => ({
  exportTaskMetricsPDF: jest.fn().mockResolvedValue(Buffer.from('pdf')),
  exportUserProductivityPDF: jest.fn().mockResolvedValue(Buffer.from('pdf')),
  exportTeamWorkloadPDF: jest.fn().mockResolvedValue(Buffer.from('pdf')),
  exportProjectSummaryPDF: jest.fn().mockResolvedValue(Buffer.from('pdf')),
  exportVelocityPDF: jest.fn().mockResolvedValue(Buffer.from('pdf')),
}));
jest.mock('../../src/modules/reports/export/excel.generator', () => ({
  exportTaskMetricsExcel: jest.fn().mockResolvedValue(Buffer.from('xlsx')),
  exportUserProductivityExcel: jest.fn().mockResolvedValue(Buffer.from('xlsx')),
  exportTeamWorkloadExcel: jest.fn().mockResolvedValue(Buffer.from('xlsx')),
  exportProjectSummaryExcel: jest.fn().mockResolvedValue(Buffer.from('xlsx')),
  exportVelocityExcel: jest.fn().mockResolvedValue(Buffer.from('xlsx')),
}));
jest.mock('../../src/infrastructure/queue/queues', () => ({
  emailQueue: { add: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('cron-parser', () => ({
  parseExpression: jest.fn().mockReturnValue({
    next: () => ({ toDate: () => new Date('2025-01-01T09:00:00Z') }),
  }),
}));

const mockContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  email: 'admin@example.com',
  role: 'admin' as const,
  requestId: 'req-1',
  locale: 'en',
};

describe('ScheduledReportService', () => {
  let service: ScheduledReportService;
  let mockRepo: jest.Mocked<ScheduledReportRepository>;
  let mockReportsService: jest.Mocked<ReportsService>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ScheduledReportService();
    mockRepo = (ScheduledReportRepository as jest.MockedClass<typeof ScheduledReportRepository>)
      .mock.instances[0] as jest.Mocked<ScheduledReportRepository>;
    mockReportsService = (ReportsService as jest.MockedClass<typeof ReportsService>)
      .mock.instances[0] as jest.Mocked<ReportsService>;
  });

  describe('list', () => {
    it('returns all scheduled reports for the tenant', async () => {
      const reports = [{ _id: 'r1', name: 'Daily Report' }];
      mockRepo.findAll.mockResolvedValue(reports as never);

      await RequestContext.run(mockContext, async () => {
        const result = await service.list();
        expect(result).toEqual(reports);
        expect(mockRepo.findAll).toHaveBeenCalledWith('tenant-1');
      });
    });
  });

  describe('getById', () => {
    it('returns report when found', async () => {
      const report = { _id: 'r1', name: 'Daily Report' };
      mockRepo.findById.mockResolvedValue(report as never);

      await RequestContext.run(mockContext, async () => {
        const result = await service.getById('r1');
        expect(result).toEqual(report);
      });
    });

    it('throws NotFoundError when not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await RequestContext.run(mockContext, async () => {
        await expect(service.getById('nonexistent')).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('create', () => {
    it('creates a scheduled report with valid cron expression', async () => {
      const created = { _id: 'r1', name: 'Daily Metrics' };
      mockRepo.create.mockResolvedValue(created as never);

      await RequestContext.run(mockContext, async () => {
        const result = await service.create({
          name: 'Daily Metrics',
          reportType: 'task-metrics',
          cronExpression: '0 9 * * *',
          recipients: ['admin@example.com'],
        });
        expect(result).toEqual(created);
        expect(mockRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            tenantId: 'tenant-1',
            name: 'Daily Metrics',
            reportType: 'task-metrics',
            format: 'csv', // default
            cronExpression: '0 9 * * *',
          })
        );
      });
    });

    it('throws BadRequestError for invalid email', async () => {
      await RequestContext.run(mockContext, async () => {
        await expect(
          service.create({
            name: 'Report',
            reportType: 'task-metrics',
            cronExpression: '0 9 * * *',
            recipients: ['not-an-email'],
          })
        ).rejects.toThrow(BadRequestError);
      });
    });
  });

  describe('update', () => {
    it('updates report name', async () => {
      const existing = { _id: 'r1', cronExpression: '0 9 * * *', timezone: 'UTC' };
      mockRepo.findById.mockResolvedValue(existing as never);
      mockRepo.update.mockResolvedValue({ ...existing, name: 'Updated' } as never);

      await RequestContext.run(mockContext, async () => {
        const result = await service.update('r1', { name: 'Updated' });
        expect(result.name).toBe('Updated');
      });
    });

    it('recalculates nextRunAt when cron expression changes', async () => {
      const existing = { _id: 'r1', cronExpression: '0 9 * * *', timezone: 'UTC' };
      mockRepo.findById.mockResolvedValue(existing as never);
      mockRepo.update.mockResolvedValue(existing as never);

      await RequestContext.run(mockContext, async () => {
        await service.update('r1', { cronExpression: '0 17 * * *' });
        expect(mockRepo.update).toHaveBeenCalledWith(
          'tenant-1',
          'r1',
          expect.objectContaining({
            cronExpression: '0 17 * * *',
            nextRunAt: expect.any(Date),
          })
        );
      });
    });

    it('throws NotFoundError when not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await RequestContext.run(mockContext, async () => {
        await expect(service.update('nonexistent', { name: 'X' })).rejects.toThrow(NotFoundError);
      });
    });

    it('validates recipients on update', async () => {
      const existing = { _id: 'r1', cronExpression: '0 9 * * *', timezone: 'UTC' };
      mockRepo.findById.mockResolvedValue(existing as never);

      await RequestContext.run(mockContext, async () => {
        await expect(
          service.update('r1', { recipients: ['bad-email'] })
        ).rejects.toThrow(BadRequestError);
      });
    });
  });

  describe('delete', () => {
    it('soft deletes report', async () => {
      mockRepo.softDelete.mockResolvedValue(true);

      await RequestContext.run(mockContext, async () => {
        await service.delete('r1');
        expect(mockRepo.softDelete).toHaveBeenCalledWith('tenant-1', 'r1');
      });
    });

    it('throws NotFoundError when not found', async () => {
      mockRepo.softDelete.mockResolvedValue(false);

      await RequestContext.run(mockContext, async () => {
        await expect(service.delete('nonexistent')).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('generateReport', () => {
    it('generates task-metrics CSV report', async () => {
      const metrics = { totalTasks: 10, completedTasks: 5 };
      mockReportsService.getTaskMetrics.mockResolvedValue(metrics as never);

      await RequestContext.run(mockContext, async () => {
        const report = {
          reportType: 'task-metrics' as const,
          format: 'csv',
          filters: {},
        };
        const result = await service.generateReport(report as never);
        expect(result.filename).toContain('task-metrics');
        expect(result.filename).toContain('.csv');
        expect(result.mimeType).toBe('text/csv');
      });
    });

    it('generates report in JSON format', async () => {
      const metrics = { totalTasks: 10 };
      mockReportsService.getTaskMetrics.mockResolvedValue(metrics as never);

      await RequestContext.run(mockContext, async () => {
        const report = {
          reportType: 'task-metrics' as const,
          format: 'json',
          filters: {},
        };
        const result = await service.generateReport(report as never);
        expect(result.mimeType).toBe('application/json');
      });
    });

    it('throws BadRequestError for unsupported report type', async () => {
      await RequestContext.run(mockContext, async () => {
        const report = {
          reportType: 'unsupported-type' as never,
          format: 'csv',
          filters: {},
        };
        await expect(service.generateReport(report as never)).rejects.toThrow(BadRequestError);
      });
    });
  });

  describe('processScheduledReport', () => {
    it('generates and emails report to all recipients', async () => {
      const { emailQueue } = require('../../src/infrastructure/queue/queues');
      const report = {
        _id: 'r1',
        tenantId: 'tenant-1',
        createdBy: { toString: () => 'user-1' },
        name: 'Daily Metrics',
        reportType: 'task-metrics' as const,
        format: 'csv',
        cronExpression: '0 9 * * *',
        timezone: 'UTC',
        recipients: ['user1@example.com', 'user2@example.com'],
        filters: {},
      };

      mockReportsService.getTaskMetrics.mockResolvedValue({ totalTasks: 10 } as never);
      mockRepo.updateAfterRun.mockResolvedValue(undefined);

      await service.processScheduledReport(report as never);

      expect(emailQueue.add).toHaveBeenCalledTimes(2); // 2 recipients
      expect(mockRepo.updateAfterRun).toHaveBeenCalledWith(
        'r1',
        expect.any(Date),
        'success'
      );
    });
  });
});
