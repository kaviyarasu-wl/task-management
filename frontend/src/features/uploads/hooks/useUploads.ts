import { useQuery } from '@tanstack/react-query';
import { uploadApi } from '../services/uploadApi';
import type { UploadEntityType } from '../types/upload.types';

export const uploadKeys = {
  all: ['uploads'] as const,
  byEntity: (entityType: UploadEntityType, entityId: string) =>
    [...uploadKeys.all, entityType, entityId] as const,
};

export function useUploads(entityType: UploadEntityType, entityId: string) {
  return useQuery({
    queryKey: uploadKeys.byEntity(entityType, entityId),
    queryFn: () => uploadApi.list({ entityType, entityId }),
    enabled: !!entityId,
    staleTime: 1000 * 60 * 2,
    select: (data) => data.data,
  });
}
