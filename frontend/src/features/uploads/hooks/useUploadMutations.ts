import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadApi, type UploadFileParams } from '../services/uploadApi';
import { uploadKeys } from './useUploads';
import { toast } from '@/shared/stores/toastStore';
import type { UploadEntityType, UploadProgress } from '../types/upload.types';

export function useUploadFile(entityType: UploadEntityType, entityId: string) {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState<Map<string, UploadProgress>>(
    new Map()
  );

  const mutation = useMutation({
    mutationFn: (params: UploadFileParams) => uploadApi.upload(params),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: uploadKeys.byEntity(entityType, entityId),
      });
      toast({ type: 'success', title: 'File uploaded successfully' });
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message =
        axiosError?.response?.data?.message || 'Failed to upload file';
      toast({ type: 'error', title: 'Upload failed', message });
    },
  });

  const uploadFile = useCallback(
    (file: File) => {
      const fileId = `${file.name}-${Date.now()}`;

      setUploadProgress((prev) => {
        const next = new Map(prev);
        next.set(fileId, {
          fileId,
          fileName: file.name,
          progress: 0,
          status: 'uploading',
        });
        return next;
      });

      mutation.mutate(
        {
          file,
          entityType,
          entityId,
          onProgress: (progress) => {
            setUploadProgress((prev) => {
              const next = new Map(prev);
              const entry = next.get(fileId);
              if (entry) {
                next.set(fileId, { ...entry, progress });
              }
              return next;
            });
          },
        },
        {
          onSuccess: () => {
            setUploadProgress((prev) => {
              const next = new Map(prev);
              next.delete(fileId);
              return next;
            });
          },
          onError: (error: unknown) => {
            const err = error as { message?: string };
            setUploadProgress((prev) => {
              const next = new Map(prev);
              const entry = next.get(fileId);
              if (entry) {
                next.set(fileId, {
                  ...entry,
                  status: 'error',
                  error: err?.message || 'Upload failed',
                });
              }
              return next;
            });
          },
        }
      );
    },
    [mutation, entityType, entityId]
  );

  return {
    uploadFile,
    uploadProgress: Array.from(uploadProgress.values()),
    isUploading: mutation.isPending,
  };
}

export function useDeleteUpload(entityType: UploadEntityType, entityId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uploadId: string) => uploadApi.delete(uploadId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: uploadKeys.byEntity(entityType, entityId),
      });
      toast({ type: 'success', title: 'File deleted' });
    },
    onError: () => {
      toast({ type: 'error', title: 'Failed to delete file' });
    },
  });
}
