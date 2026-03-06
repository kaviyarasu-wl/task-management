import Redis, { RedisOptions } from 'ioredis';
import { config } from '../../config';
import { createLogger } from '@infrastructure/logger';
import { Gauge } from 'prom-client';
import { register } from '@infrastructure/metrics';

const log = createLogger('Redis');

let redisClient: Redis | null = null;

const redisConnectionStatus = new Gauge({
  name: 'redis_connection_status',
  help: 'Redis connection status (1 = connected, 0 = disconnected)',
  registers: [register],
});

const baseRedisOptions: RedisOptions = {
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD || undefined,
  enableReadyCheck: true,
  retryStrategy: (times) => {
    if (times > 10) {
      log.error('Max retries exceeded');
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

  redisClient.on('connect', () => {
    log.info('Redis connected');
    redisConnectionStatus.set(1);
  });
  redisClient.on('error', (err) => log.error({ err }, 'Redis error'));
  redisClient.on('close', () => {
    log.warn('Redis connection closed');
    redisConnectionStatus.set(0);
  });

  return redisClient;
}

export async function disconnectRedis(): Promise<void> {
  if (!redisClient) return;
  await redisClient.quit();
  redisClient = null;
  log.info('Redis disconnected cleanly');
}
