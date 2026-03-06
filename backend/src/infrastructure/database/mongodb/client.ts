import mongoose from 'mongoose';
import { config } from '../../../config';
import { createLogger } from '@infrastructure/logger';
import { dbConnectionPool } from '@infrastructure/metrics';

const log = createLogger('MongoDB');

let isConnected = false;

export async function connectMongoDB(): Promise<void> {
  if (isConnected) return;

  mongoose.connection.on('connected', () => {
    log.info('MongoDB connected');
    isConnected = true;
    // Report connection pool size from the underlying driver
    const pool = mongoose.connection.getClient().options?.maxPoolSize;
    if (pool) dbConnectionPool.set(pool);
  });

  mongoose.connection.on('error', (err) => {
    log.error({ err }, 'MongoDB connection error');
    isConnected = false;
  });

  mongoose.connection.on('disconnected', () => {
    log.warn('MongoDB disconnected');
    isConnected = false;
  });

  await mongoose.connect(config.MONGODB_URI, {
    maxPoolSize: config.MONGO_MAX_POOL_SIZE,     // Default 20 (configurable)
    minPoolSize: config.MONGO_MIN_POOL_SIZE,     // Keep connections warm
    maxIdleTimeMS: 60000,                         // Close idle connections after 60s
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  // Enable query timing in development when explicitly opted in
  if (config.ENABLE_QUERY_LOGGING) {
    mongoose.set('debug', (collectionName: string, method: string, query: unknown) => {
      log.debug(
        { collection: collectionName, method, query: JSON.stringify(query).slice(0, 200) },
        `${collectionName}.${method}`
      );
    });
  }
}

export async function disconnectMongoDB(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  log.info('MongoDB disconnected cleanly');
}

export { mongoose };
