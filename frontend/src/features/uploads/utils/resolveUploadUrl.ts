import { config } from '@/shared/constants/config';

const backendOrigin = new URL(config.apiUrl).origin;

export function resolveUploadUrl(url: string): string {
  if (url.startsWith('http')) return url;
  return `${backendOrigin}${url}`;
}
