import { z } from 'zod';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
];

export const uploadFileSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, 'File size must be under 10MB')
    .refine(
      (file) => ALLOWED_MIME_TYPES.includes(file.type),
      'File type not supported'
    ),
  entityType: z.enum(['task', 'comment', 'project']),
  entityId: z.string().min(1),
});

export { MAX_FILE_SIZE, ALLOWED_MIME_TYPES };
