// Set test environment variables before any imports
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/task-saas-test';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-at-least-32-chars-long';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-at-least-32-chars-long';
