export type ExportFormat = 'csv' | 'pdf' | 'excel';
export type ExportType = 'tasks' | 'reports';

export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ExportGenerateResponse {
  /** Present for small, synchronous exports */
  downloadUrl?: string;
  /** Present for large, async exports */
  jobId?: string;
}

export interface ExportStatusResponse {
  jobId: string;
  status: ExportStatus;
  progress: number;
  downloadUrl?: string;
  error?: string;
}
