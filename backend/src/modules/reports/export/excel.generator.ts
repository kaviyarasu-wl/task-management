import ExcelJS from 'exceljs';
import type { ColumnDefinition } from './export.types';
import type {
  TaskMetrics,
  UserProductivity,
  TeamWorkload,
  ProjectSummary,
  VelocityReport,
} from '../reports.types';

const HEADER_STYLE: Partial<ExcelJS.Style> = {
  font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } },
  alignment: { horizontal: 'center', vertical: 'middle' },
  border: {
    bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  },
};

const DATA_STYLE: Partial<ExcelJS.Style> = {
  font: { size: 10 },
  alignment: { vertical: 'middle' },
};

function styleHeaderRow(sheet: ExcelJS.Worksheet): void {
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.style = HEADER_STYLE;
  });
  headerRow.height = 30;
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
}

/**
 * Generate an Excel workbook from tabular data.
 * Returns a Buffer containing the complete .xlsx file.
 */
export async function generateExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ColumnDefinition[],
  sheetName: string
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'TaskSaaS';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(sheetName);

  // Define columns
  sheet.columns = columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: Math.max(col.header.length + 4, 15),
  }));

  // Style header row
  styleHeaderRow(sheet);

  // Add data rows
  for (const row of data) {
    const values: Record<string, unknown> = {};
    for (const col of columns) {
      const rawValue = row[col.key];
      values[col.key] = col.formatter ? col.formatter(rawValue) : rawValue;
    }
    const dataRow = sheet.addRow(values);
    dataRow.eachCell((cell) => {
      cell.style = DATA_STYLE;
    });
  }

  // Auto-filter on header row
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns.length },
  };

  // Freeze header row
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

// --- Report-specific Excel generators ---

export async function exportTaskMetricsExcel(
  metrics: TaskMetrics
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'TaskSaaS';
  workbook.created = new Date();

  // Sheet 1: Summary
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 20 },
  ];
  styleHeaderRow(summarySheet);

  summarySheet.addRows([
    { metric: 'Total Tasks', value: metrics.totalTasks },
    { metric: 'Completed Tasks', value: metrics.completedTasks },
    { metric: 'Overdue Count', value: metrics.overdueCount },
    { metric: 'Completed This Week', value: metrics.completedThisWeek },
    {
      metric: 'Avg Completion Time (hours)',
      value: metrics.averageCompletionTimeHours,
    },
  ]);

  // Sheet 2: Status Distribution
  const statusSheet = workbook.addWorksheet('By Status');
  statusSheet.columns = [
    { header: 'Status', key: 'name', width: 25 },
    { header: 'Count', key: 'count', width: 15 },
    { header: 'Percentage', key: 'percentage', width: 15 },
  ];
  styleHeaderRow(statusSheet);

  for (const s of metrics.statusDistribution) {
    statusSheet.addRow({
      name: s.name,
      count: s.count,
      percentage:
        metrics.totalTasks > 0
          ? `${((s.count / metrics.totalTasks) * 100).toFixed(1)}%`
          : '0.0%',
    });
  }

  // Sheet 3: Priority Distribution
  const prioritySheet = workbook.addWorksheet('By Priority');
  prioritySheet.columns = [
    { header: 'Priority', key: 'priority', width: 25 },
    { header: 'Count', key: 'count', width: 15 },
    { header: 'Percentage', key: 'percentage', width: 15 },
  ];
  styleHeaderRow(prioritySheet);

  for (const p of metrics.priorityDistribution) {
    prioritySheet.addRow({
      priority: p.priority,
      count: p.count,
      percentage:
        metrics.totalTasks > 0
          ? `${((p.count / metrics.totalTasks) * 100).toFixed(1)}%`
          : '0.0%',
    });
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export async function exportUserProductivityExcel(
  data: UserProductivity[]
): Promise<Buffer> {
  const columns: ColumnDefinition[] = [
    { key: 'userName', header: 'User' },
    { key: 'userEmail', header: 'Email' },
    { key: 'totalTasks', header: 'Total Tasks' },
    { key: 'completedTasks', header: 'Completed' },
    { key: 'overdueTasks', header: 'Overdue' },
    {
      key: 'onTimePercentage',
      header: 'On-Time %',
      formatter: (v) => `${Number(v).toFixed(1)}%`,
    },
  ];

  return generateExcel(
    data as unknown as Record<string, unknown>[],
    columns,
    'User Productivity'
  );
}

export async function exportTeamWorkloadExcel(
  data: TeamWorkload[]
): Promise<Buffer> {
  const columns: ColumnDefinition[] = [
    { key: 'userName', header: 'Team Member' },
    { key: 'userEmail', header: 'Email' },
    { key: 'totalTasks', header: 'Total Tasks' },
    { key: 'urgent', header: 'Urgent' },
    { key: 'highPriority', header: 'High Priority' },
    { key: 'overdue', header: 'Overdue' },
    { key: 'dueSoon', header: 'Due Soon' },
    {
      key: 'workloadScore',
      header: 'Workload Score',
      formatter: (v) => Number(v).toFixed(1),
    },
  ];

  return generateExcel(
    data as unknown as Record<string, unknown>[],
    columns,
    'Team Workload'
  );
}

export async function exportProjectSummaryExcel(
  data: ProjectSummary[]
): Promise<Buffer> {
  const columns: ColumnDefinition[] = [
    { key: 'projectName', header: 'Project' },
    { key: 'totalTasks', header: 'Total Tasks' },
    { key: 'completedTasks', header: 'Completed' },
    { key: 'overdueTasks', header: 'Overdue' },
    {
      key: 'completionRate',
      header: 'Completion Rate',
      formatter: (v) => `${Number(v).toFixed(1)}%`,
    },
  ];

  return generateExcel(
    data as unknown as Record<string, unknown>[],
    columns,
    'Project Summary'
  );
}

export async function exportVelocityExcel(
  report: VelocityReport
): Promise<Buffer> {
  const columns: ColumnDefinition[] = [
    { key: 'date', header: 'Period' },
    { key: 'created', header: 'Created' },
    { key: 'completed', header: 'Completed' },
  ];

  return generateExcel(
    report.data as unknown as Record<string, unknown>[],
    columns,
    'Velocity'
  );
}
