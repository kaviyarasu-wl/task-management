import Redis from 'ioredis';
import { config } from '../config';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (redisClient) return redisClient;

  redisClient = new Redis({
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    password: config.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    retryStrategy: (times) => {
      if (times > 10) {
        console.error('❌ Redis: max retries exceeded');
        return null; // Stop retrying
      }
      return Math.min(times * 200, 2000); // Exponential backoff, max 2s
    },
    reconnectOnError: (err) => {
      const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
      return targetErrors.some((e) => err.message.includes(e));
    },
  });

  redisClient.on('connect', () => console.log('✅ Redis connected'));
  redisClient.on('error', (err) => console.error('❌ Redis error:', err.message));
  redisClient.on('close', () => console.warn('⚠️  Redis connection closed'));

  return redisClient;
}

export async function disconnectRedis(): Promise<void> {
  if (!redisClient) return;
  await redisClient.quit();
  redisClient = null;
  console.log('Redis disconnected cleanly');
}
