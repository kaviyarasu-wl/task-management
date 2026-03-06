import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),

  // Database
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Admin JWT (separate secrets for admin authentication)
  JWT_ADMIN_SECRET: z.string().min(32).optional(),
  JWT_ADMIN_EXPIRES_IN: z.string().default('1h'),

  // Email
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  EMAIL_FROM: z.string().default('Task SaaS <no-reply@example.com>'),
  EMAIL_TEMPLATE_PATH: z.string().default('./src/infrastructure/email/templates'),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  SENTRY_DSN: z.string().url().optional(),

  // CORS & Proxy
  CORS_ORIGINS: z
    .string()
    .default('*')
    .transform((v) => (v === '*' ? '*' : v.split(','))),
  TRUST_PROXY: z.coerce.boolean().default(false),

  // File Storage
  STORAGE_PROVIDER: z.enum(['local', 's3']).default('local'),
  UPLOAD_DIR: z.string().default('uploads'),

  // S3 / MinIO (only used when STORAGE_PROVIDER=s3)
  S3_ENDPOINT: z.string().url().optional(),
  S3_BUCKET: z.string().default('task-app-uploads'),
  S3_ACCESS_KEY: z.string().default('minioadmin'),
  S3_SECRET_KEY: z.string().default('minioadmin'),
  S3_REGION: z.string().default('us-east-1'),
  MAX_FILE_SIZE: z.coerce.number().default(10 * 1024 * 1024), // 10MB
  ALLOWED_FILE_TYPES: z
    .string()
    .default('image/png,image/jpeg,image/gif,application/pdf,text/csv')
    .transform((v) => v.split(',')),

  // Search
  SEARCH_PROVIDER: z.enum(['atlas', 'meilisearch', 'basic']).default('basic'),
  MEILISEARCH_HOST: z.string().url().optional(),
  MEILISEARCH_API_KEY: z.string().optional(),

  // OAuth (all optional — providers with missing config are disabled)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  MICROSOFT_CLIENT_ID: z.string().optional(),
  MICROSOFT_CLIENT_SECRET: z.string().optional(),
  OAUTH_CALLBACK_BASE_URL: z.string().url().optional()
    .default('http://localhost:3000'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  OAUTH_STATE_SECRET: z.string().min(32).optional(),

  // MFA
  MFA_ENCRYPTION_KEY: z
    .string()
    .length(64, 'MFA_ENCRYPTION_KEY must be 64 hex chars (32 bytes)')
    .regex(/^[a-f0-9]+$/i, 'Must be hex')
    .optional(), // Optional in dev — derived from JWT secret; required in production
  MFA_ISSUER_NAME: z.string().default('TaskSaaS'),

  // Integrations (Slack, GitHub, Jira)
  SLACK_CLIENT_ID: z.string().optional(),
  SLACK_CLIENT_SECRET: z.string().optional(),
  GITHUB_APP_ID: z.string().optional(),
  GITHUB_APP_SECRET: z.string().optional(),
  JIRA_CLIENT_ID: z.string().optional(),
  JIRA_CLIENT_SECRET: z.string().optional(),
  INTEGRATION_ENCRYPTION_KEY: z
    .string()
    .length(64, 'INTEGRATION_ENCRYPTION_KEY must be 64 hex chars (32 bytes)')
    .regex(/^[a-f0-9]+$/i, 'Must be hex')
    .optional(),

  // Audit Log
  AUDIT_LOG_RETENTION_DAYS: z.coerce.number().min(30).default(365),
  AUDIT_LOG_ENABLED: z.enum(['true', 'false']).default('true')
    .transform((v) => v === 'true'),

  // i18n
  DEFAULT_LOCALE: z.string().default('en'),
  SUPPORTED_LOCALES: z.string().default('en,es,fr,de,ja'),

  // Rate Limiting
  RATE_LIMIT_FREE: z.coerce.number().default(100),
  RATE_LIMIT_PRO: z.coerce.number().default(1000),
  RATE_LIMIT_ENTERPRISE: z.coerce.number().default(10000),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),

  // Performance: MongoDB Connection Pool
  MONGO_MAX_POOL_SIZE: z.coerce.number().default(20),
  MONGO_MIN_POOL_SIZE: z.coerce.number().default(5),

  // Performance: Cache TTLs (seconds)
  CACHE_DEFAULT_TTL: z.coerce.number().default(300),       // 5 minutes
  CACHE_STATUS_TTL: z.coerce.number().default(3600),       // 1 hour (status rarely changes)
  CACHE_USER_TTL: z.coerce.number().default(600),          // 10 minutes

  // Performance: Query Debugging
  ENABLE_QUERY_LOGGING: z.coerce.boolean().default(false),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1); // Fail fast — never run with missing config
}

export const config = parsed.data;

export type Config = typeof config;
