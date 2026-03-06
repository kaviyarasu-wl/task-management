import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

export const register = new Registry();

// Collect Node.js default metrics (event loop lag, heap, GC, etc.)
collectDefaultMetrics({ register });

// ── HTTP metrics ──────────────────────────────────────────────────────

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [register],
});

// ── Database metrics ──────────────────────────────────────────────────

export const dbConnectionPool = new Gauge({
  name: 'db_connection_pool_size',
  help: 'Current MongoDB connection pool size',
  registers: [register],
});

// ── Queue metrics ─────────────────────────────────────────────────────

export const queueJobTotal = new Counter({
  name: 'queue_jobs_total',
  help: 'Total number of queue jobs processed',
  labelNames: ['queue', 'status'] as const, // status: completed | failed
  registers: [register],
});

export const queueJobDuration = new Histogram({
  name: 'queue_job_duration_seconds',
  help: 'Duration of queue job processing',
  labelNames: ['queue'] as const,
  buckets: [0.1, 0.5, 1, 5, 10, 30, 60],
  registers: [register],
});

export const queueWaitingJobs = new Gauge({
  name: 'queue_waiting_jobs',
  help: 'Number of jobs waiting in queue',
  labelNames: ['queue'] as const,
  registers: [register],
});

// ── EventBus metrics ──────────────────────────────────────────────────

export const eventEmitTotal = new Counter({
  name: 'event_emit_total',
  help: 'Total events emitted',
  labelNames: ['event'] as const,
  registers: [register],
});

// ── WebSocket metrics ─────────────────────────────────────────────────

export const wsConnectionsActive = new Gauge({
  name: 'ws_connections_active',
  help: 'Active WebSocket connections',
  registers: [register],
});

// ── Application metrics ───────────────────────────────────────────────

export const appStartupDuration = new Gauge({
  name: 'app_startup_duration_seconds',
  help: 'Time taken for the application to start',
  registers: [register],
});
