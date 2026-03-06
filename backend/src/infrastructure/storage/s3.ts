import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../../config';
import { randomUUID } from 'crypto';
import { StorageProvider } from './storage.types';

export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;

  constructor() {
    this.client = new S3Client({
      ...(config.S3_ENDPOINT && { endpoint: config.S3_ENDPOINT }),
      region: config.S3_REGION,
      credentials: {
        accessKeyId: config.S3_ACCESS_KEY,
        secretAccessKey: config.S3_SECRET_KEY,
      },
      forcePathStyle: !!config.S3_ENDPOINT, // Required for MinIO
    });
  }

  async uploadFile(
    tenantId: string,
    filename: string,
    body: Buffer,
    mimetype: string
  ): Promise<{ key: string; url: string }> {
    const key = `${tenantId}/${randomUUID()}/${filename}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: config.S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: mimetype,
      })
    );

    const url = config.S3_ENDPOINT
      ? `${config.S3_ENDPOINT}/${config.S3_BUCKET}/${key}`
      : `https://${config.S3_BUCKET}.s3.${config.S3_REGION}.amazonaws.com/${key}`;

    return { key, url };
  }

  async getDownloadUrl(key: string, expiresIn = 900): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: config.S3_BUCKET,
        Key: key,
      }),
      { expiresIn }
    );
  }

  async deleteFile(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: config.S3_BUCKET,
        Key: key,
      })
    );
  }
}
