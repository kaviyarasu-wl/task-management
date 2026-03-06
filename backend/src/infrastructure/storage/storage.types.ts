export interface StorageProvider {
  uploadFile(
    tenantId: string,
    filename: string,
    body: Buffer,
    mimetype: string
  ): Promise<{ key: string; url: string }>;

  getDownloadUrl(key: string, expiresIn?: number): Promise<string>;

  deleteFile(key: string): Promise<void>;
}
