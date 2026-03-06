import { Schema, model } from 'mongoose';
import { applyBaseSchema, BaseDocument } from '@infrastructure/database/mongodb/baseModel';

export type EntityType = 'task' | 'comment';

export interface IUpload extends BaseDocument {
  filename: string;
  key: string;
  mimetype: string;
  size: number;
  url: string;
  uploadedBy: string;
  entityType: EntityType;
  entityId: string;
}

const uploadSchema = new Schema<IUpload>({
  filename: { type: String, required: true, trim: true },
  key: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  url: { type: String, required: true },
  uploadedBy: { type: String, required: true },
  entityType: { type: String, enum: ['task', 'comment'], required: true },
  entityId: { type: String, required: true },
});

applyBaseSchema(uploadSchema);

// Find all files for an entity
uploadSchema.index({ tenantId: 1, entityType: 1, entityId: 1 });
// Find user's uploads
uploadSchema.index({ tenantId: 1, uploadedBy: 1 });
// Unique S3 key lookup
uploadSchema.index({ key: 1 }, { unique: true });

export const Upload = model<IUpload>('Upload', uploadSchema);
