/**
 * Export types for report data exports
 */

export type ExportFormat = 'csv' | 'json' | 'pdf' | 'xlsx';

export type ReportType =
  | 'task-metrics'
  | 'user-productivity'
  | 'team-workload'
  | 'project-summary'
  | 'velocity';

export interface ColumnDefinition {
  key: string;
  header: string;
  formatter?: (value: unknown) => string;
}

export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  includeMetadata?: boolean;
  prettyPrint?: boolean;
}

export interface ExportResult {
  content: string;
  filename: string;
  mimeType: string;
}

export interface ExportMetadata {
  generatedAt: string;
  tenantId: string;
  generatedBy: string;
  reportType: ReportType;
  filters?: Record<string, unknown>;
}

export interface JSONExportOptions {
  includeMetadata?: boolean;
  prettyPrint?: boolean;
}
