export type UploadEntityType = 'task' | 'comment' | 'project';

export interface Upload {
  _id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  entityType: UploadEntityType;
  entityId: string;
  uploadedBy: string;
  url: string;
  thumbnailUrl?: string;
  createdAt: string;
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}
