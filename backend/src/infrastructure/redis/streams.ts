import { getRedisClient } from './client';

/**
 * Redis Streams helpers — persistent event log.
 * Unlike pub/sub (fire-and-forget), streams retain messages.
 * Use for audit logs, event replay, or inter-service messaging.
 */
export const streams = {
  async publish(streamKey: string, fields: Record<string, string>): Promise<string|null> {
    const redis = getRedisClient();
    // '*' lets Redis auto-generate the message ID (timestamp-based)
    return redis.xadd(streamKey, '*', ...Object.entries(fields).flat());
  },

  async read(
    streamKey: string,
    lastId = '0', // '0' reads from beginning; '$' reads only new messages
    count = 100
  ): Promise<Array<{ id: string; fields: Record<string, string> }>> {
    const redis = getRedisClient();
    const results = await redis.xread('COUNT', count, 'STREAMS', streamKey, lastId);
    if (!results) return [];

    return results.flatMap(([, messages]) =>
      messages.map(([id, rawFields]) => {
        const fields: Record<string, string> = {};
        for (let i = 0; i < rawFields.length; i += 2) {
          fields[rawFields[i]!] = rawFields[i + 1]!;
        }
        return { id, fields };
      })
    );
  },

  async trim(streamKey: string, maxLen: number): Promise<number> {
    const redis = getRedisClient();
    return redis.xtrim(streamKey, 'MAXLEN', '~', maxLen);
  },

  keys: {
    taskEvents: (tenantId: string) => `stream:${tenantId}:task-events`,
    auditLog: (tenantId: string) => `stream:${tenantId}:audit`,
  },
};
