import crypto from 'crypto';
import { config } from '@config/index';

const ALGORITHM = 'aes-256-gcm';

export function encryptConfig(plaintext: Record<string, unknown>): string {
  const key = Buffer.from(config.INTEGRATION_ENCRYPTION_KEY!, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(JSON.stringify(plaintext), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:ciphertext
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decryptConfig(ciphertext: string): Record<string, unknown> {
  const key = Buffer.from(config.INTEGRATION_ENCRYPTION_KEY!, 'hex');
  const [ivHex, authTagHex, encrypted] = ciphertext.split(':');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return JSON.parse(decrypted);
}
