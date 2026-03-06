import { useState, useCallback, useRef, useEffect } from 'react';
import { exportApi } from '@/shared/services/exportApi';
import { toast } from '@/shared/stores/toastStore';
import type { ExportFormat, ExportType } from '@/shared/types/export.types';

const POLL_INTERVAL_MS = 2000;

interface UseExportReturn {
  startExport: (
    type: ExportType,
    format: ExportFormat,
    filters?: Record<string, string>
  ) => void;
  isExporting: boolean;
  progress: number;
  jobId: string | null;
  format: ExportFormat | null;
  cancelExport: () => void;
}

export function useExport(): UseExportReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [format, setFormat] = useState<ExportFormat | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isCancelledRef = useRef(false);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const triggerDownload = useCallback((url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
  }, []);

  const pollForCompletion = useCallback(
    (currentJobId: string, currentFormat: ExportFormat) => {
      pollingRef.current = setInterval(async () => {
        if (isCancelledRef.current) {
          stopPolling();
          return;
        }

        try {
          const response = await exportApi.status(currentJobId);
          const {
            status,
            progress: jobProgress,
            downloadUrl,
            error,
          } = response.data;

          setProgress(jobProgress);

          if (status === 'completed' && downloadUrl) {
            stopPolling();
            triggerDownload(downloadUrl, `export.${currentFormat}`);
            setIsExporting(false);
            setJobId(null);
            toast({ type: 'success', title: 'Export downloaded' });
          } else if (status === 'failed') {
            stopPolling();
            setIsExporting(false);
            setJobId(null);
            toast({
              type: 'error',
              title: 'Export failed',
              message: error ?? 'An unexpected error occurred',
            });
          }
        } catch {
          stopPolling();
          setIsExporting(false);
          setJobId(null);
          toast({ type: 'error', title: 'Failed to check export status' });
        }
      }, POLL_INTERVAL_MS);
    },
    [stopPolling, triggerDownload]
  );

  const startExport = useCallback(
    async (
      type: ExportType,
      exportFormat: ExportFormat,
      filters?: Record<string, string>
    ) => {
      setIsExporting(true);
      setProgress(0);
      setFormat(exportFormat);
      isCancelledRef.current = false;

      try {
        const response = await exportApi.generate(type, exportFormat, filters);
        const { downloadUrl, jobId: newJobId } = response.data;

        if (downloadUrl) {
          triggerDownload(downloadUrl, `export.${exportFormat}`);
          setIsExporting(false);
          toast({ type: 'success', title: 'Export downloaded' });
        } else if (newJobId) {
          setJobId(newJobId);
          pollForCompletion(newJobId, exportFormat);
        }
      } catch {
        setIsExporting(false);
        toast({ type: 'error', title: 'Failed to start export' });
      }
    },
    [triggerDownload, pollForCompletion]
  );

  const cancelExport = useCallback(async () => {
    isCancelledRef.current = true;
    stopPolling();

    if (jobId) {
      try {
        await exportApi.cancel(jobId);
      } catch {
        // Best-effort cancel
      }
    }

    setIsExporting(false);
    setJobId(null);
    setProgress(0);
    toast({ type: 'info', title: 'Export cancelled' });
  }, [jobId, stopPolling]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return { startExport, isExporting, progress, jobId, format, cancelExport };
}
