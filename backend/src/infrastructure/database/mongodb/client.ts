import mongoose from 'mongoose';
import { config } from '../../../config';

let isConnected = false;

export async function connectMongoDB(): Promise<void> {
  if (isConnected) return;

  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connected');
    isConnected = true;
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
    isConnected = false;
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected');
    isConnected = false;
  });

  await mongoose.connect(config.MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
}

export async function disconnectMongoDB(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  console.log('MongoDB disconnected cleanly');
}

export { mongoose };
