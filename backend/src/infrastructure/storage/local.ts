import { mkdir, unlink, access } from 'fs/promises';
import { writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { config } from '../../config';
import { StorageProvider } from './storage.types';

export class LocalStorageProvider implements StorageProvider {
  private readonly baseDir: string;

  constructor() {
    this.baseDir = path.resolve(config.UPLOAD_DIR);
  }

  async uploadFile(
    tenantId: string,
    filename: string,
    body: Buffer,
    _mimetype: string
  ): Promise<{ key: string; url: string }> {
    const key = `${tenantId}/${randomUUID()}/${filename}`;
    const filePath = path.join(this.baseDir, key);

    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, body);

    const url = `/uploads/${key}`;
    return { key, url };
  }

  async getDownloadUrl(key: string): Promise<string> {
    return `/uploads/${key}`;
  }

  async deleteFile(key: string): Promise<void> {
    const filePath = path.join(this.baseDir, key);
    try {
      await access(filePath);
      await unlink(filePath);
    } catch {
      // File already gone — ignore
    }
  }
}
