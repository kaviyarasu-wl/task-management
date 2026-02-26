import { getRedisClient } from './client';

/**
 * Generic cache utility implementing cache-aside pattern.
 * Key naming: cache:{tenantId}:{entity}:{id}
 * This prevents cross-tenant cache hits by design.
 */
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const redis = getRedisClient();
    const value = await redis.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  },

  async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    const redis = getRedisClient();
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  },

  async del(key: string): Promise<void> {
    const redis = getRedisClient();
    await redis.del(key);
  },

  /** Invalidate all keys matching a pattern — use for cache bust on writes */
  async delPattern(pattern: string): Promise<void> {
    const redis = getRedisClient();
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  },

  /** Cache-aside helper: get from cache or fetch from source */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds = 300
  ): Promise<T> {
    const cached = await cache.get<T>(key);
    if (cached !== null) return cached;

    const value = await fetcher();
    await cache.set(key, value, ttlSeconds);
    return value;
  },

  keys: {
    taskList: (tenantId: string, projectId?: string) =>
      `cache:${tenantId}:tasks:list:${projectId ?? 'all'}`,
    task: (tenantId: string, taskId: string) =>
      `cache:${tenantId}:task:${taskId}`,
    project: (tenantId: string, projectId: string) =>
      `cache:${tenantId}:project:${projectId}`,
    projectList: (tenantId: string) =>
      `cache:${tenantId}:projects:list`,
  },
};
