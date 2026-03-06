import { config } from '../../config';
import { StorageProvider } from './storage.types';
import { S3StorageProvider } from './s3';
import { LocalStorageProvider } from './local';

function createStorageProvider(): StorageProvider {
  switch (config.STORAGE_PROVIDER) {
    case 's3':
      return new S3StorageProvider();
    case 'local':
      return new LocalStorageProvider();
  }
}

const provider = createStorageProvider();

export const uploadFile = provider.uploadFile.bind(provider);
export const getPresignedDownloadUrl = provider.getDownloadUrl.bind(provider);
export const deleteFile = provider.deleteFile.bind(provider);

export type { StorageProvider } from './storage.types';
