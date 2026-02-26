import Redis, { RedisOptions } from 'ioredis';
import { config } from '../../config';

let redisClient: Redis | null = null;

const baseRedisOptions: RedisOptions = {
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD || undefined,
  enableReadyCheck: true,
  retryStrategy: (times) => {
    if (times > 10) {
      console.error('❌ Redis: max retries exceeded');
      return null;
    }
    return Math.min(times * 200, 2000);
  },
  reconnectOnError: (err) => {
    const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
    return targetErrors.some((e) => err.message.includes(e));
  },
};

/**
 * Get Redis connection options for BullMQ workers.
 * BullMQ requires maxRetriesPerRequest: null for blocking commands.
 */
export function getBullMQConnection(): RedisOptions {
  return {
    ...baseRedisOptions,
    maxRetriesPerRequest: null,
  };
}

export function getRedisClient(): Redis {
  if (redisClient) return redisClient;

  redisClient = new Redis({
    ...baseRedisOptions,
    maxRetriesPerRequest: 3,
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
