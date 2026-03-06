import { Upload, IUpload, EntityType } from './upload.model';

export class UploadRepository {
  async findById(tenantId: string, uploadId: string): Promise<IUpload | null> {
    return Upload.findOne({ _id: uploadId, tenantId, deletedAt: null }).exec();
  }

  async findByEntity(
    tenantId: string,
    entityType: EntityType,
    entityId: string
  ): Promise<IUpload[]> {
    return Upload.find({
      tenantId,
      entityType,
      entityId,
      deletedAt: null,
    })
      .sort({ createdAt: -1 })
      .exec();
  }

  async create(data: {
    tenantId: string;
    filename: string;
    key: string;
    mimetype: string;
    size: number;
    url: string;
    uploadedBy: string;
    entityType: EntityType;
    entityId: string;
  }): Promise<IUpload> {
    const upload = new Upload(data);
    return upload.save();
  }

  async softDelete(tenantId: string, uploadId: string): Promise<IUpload | null> {
    return Upload.findOneAndUpdate(
      { _id: uploadId, tenantId, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    ).exec();
  }
}
