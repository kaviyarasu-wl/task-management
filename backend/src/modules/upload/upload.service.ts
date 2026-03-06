import { UploadRepository } from './upload.repository';
import { IUpload, EntityType } from './upload.model';
import { RequestContext } from '@core/context/RequestContext';
import { BadRequestError, ForbiddenError, NotFoundError } from '@core/errors/AppError';
import { EventBus } from '@core/events/EventBus';
import {
  uploadFile,
  getPresignedDownloadUrl,
  deleteFile,
} from '@infrastructure/storage';
import { Task } from '@modules/task/task.model';
import { TaskRepository } from '@modules/task/task.repository';
import { Comment } from '@modules/comment/comment.model';
import { CommentRepository } from '@modules/comment/comment.repository';
import { Types } from 'mongoose';

export class UploadService {
  private repo: UploadRepository;
  private taskRepo: TaskRepository;
  private commentRepo: CommentRepository;

  constructor() {
    this.repo = new UploadRepository();
    this.taskRepo = new TaskRepository();
    this.commentRepo = new CommentRepository();
  }

  async upload(
    file: Express.Multer.File,
    entityType: EntityType,
    entityId: string
  ): Promise<IUpload> {
    const { tenantId, userId } = RequestContext.get();

    if (!file) {
      throw new BadRequestError('No file provided');
    }

    // Validate entity exists before uploading
    if (entityType === 'task') {
      const task = await Task.findOne({ _id: entityId, tenantId, deletedAt: null }).exec();
      if (!task) throw new NotFoundError('Task');
    } else {
      const comment = await Comment.findOne({ _id: entityId, tenantId, deletedAt: null }).exec();
      if (!comment) throw new NotFoundError('Comment');
    }

    // Upload to S3
    const { key, url } = await uploadFile(
      tenantId,
      file.originalname,
      file.buffer,
      file.mimetype
    );

    // Save metadata — rollback S3 on failure
    let upload: IUpload;
    try {
      upload = await this.repo.create({
        tenantId,
        filename: file.originalname,
        key,
        mimetype: file.mimetype,
        size: file.size,
        url,
        uploadedBy: userId,
        entityType,
        entityId,
      });
    } catch (err) {
      await deleteFile(key).catch(() => {}); // best-effort cleanup
      throw err;
    }

    // Link attachment to the parent entity
    if (entityType === 'task') {
      await this.taskRepo.addAttachment(tenantId, entityId, {
        filename: file.originalname,
        url,
        uploadedAt: new Date(),
      });
    } else {
      await this.commentRepo.addAttachment(tenantId, entityId, {
        uploadId: new Types.ObjectId(upload.id as string),
        filename: file.originalname,
        url,
        mimetype: file.mimetype,
        size: file.size,
      });
    }

    await EventBus.emit('file.uploaded', {
      uploadId: upload.id as string,
      tenantId,
      entityType,
      entityId,
      uploadedBy: userId,
    });

    return upload;
  }

  async getDownloadUrl(
    uploadId: string
  ): Promise<{ url: string; expiresIn: number }> {
    const { tenantId } = RequestContext.get();

    const upload = await this.repo.findById(tenantId, uploadId);
    if (!upload) throw new NotFoundError('Upload');

    const expiresIn = 900; // 15 minutes
    const url = await getPresignedDownloadUrl(upload.key, expiresIn);

    return { url, expiresIn };
  }

  async listByEntity(
    entityType: EntityType,
    entityId: string
  ): Promise<IUpload[]> {
    const { tenantId } = RequestContext.get();
    return this.repo.findByEntity(tenantId, entityType, entityId);
  }

  async delete(uploadId: string): Promise<void> {
    const { tenantId, userId, role } = RequestContext.get();

    const upload = await this.repo.findById(tenantId, uploadId);
    if (!upload) throw new NotFoundError('Upload');

    // Only uploader or admins/owners can delete
    const canDelete =
      upload.uploadedBy === userId || ['owner', 'admin'].includes(role);

    if (!canDelete) throw new ForbiddenError('You cannot delete this file');

    // Soft-delete metadata first, then remove from S3
    await this.repo.softDelete(tenantId, uploadId);
    await deleteFile(upload.key);

    // Unlink attachment from the parent entity
    if (upload.entityType === 'task') {
      await this.taskRepo.removeAttachment(tenantId, upload.entityId, upload.filename);
    } else {
      await this.commentRepo.removeAttachment(tenantId, upload.entityId, uploadId);
    }

    await EventBus.emit('file.deleted', {
      uploadId,
      tenantId,
      entityType: upload.entityType,
      entityId: upload.entityId,
      deletedBy: userId,
    });
  }
}
