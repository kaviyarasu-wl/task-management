import request from 'supertest';
import express from 'express';
import { createApp } from '../../src/app';
import { setupTestDb, teardownTestDb, clearTestDb } from '../helpers/testDb';
import { clearMockRedis, resetMockRedis } from '../helpers/testRedis';
import { getAuthHeader } from '../helpers/authHelpers';
import { Tenant } from '../../src/modules/tenant/tenant.model';
import { User } from '../../src/modules/user/user.model';
import { Status } from '../../src/modules/status/status.model';
import bcrypt from 'bcryptjs';

jest.mock('../../src/infrastructure/redis/client', () => {
  const { createMockRedis: createRedis } = require('../helpers/testRedis');
  return { getRedisClient: () => createRedis() };
});

let app: express.Application;

describe('Status Routes Integration', () => {
  let tenantId: string;
  let userId: string;
  let authHeader: Record<string, string>;

  beforeAll(async () => {
    await setupTestDb();
    app = await createApp();
  });

  afterAll(async () => {
    resetMockRedis();
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    await clearMockRedis();

    const tenant = new Tenant({
      tenantId: 'test-tenant-123',
      name: 'Test Organization',
      slug: 'test-org',
      ownerId: 'temp-owner',
    });
    await tenant.save();
    tenantId = tenant.tenantId;

    const passwordHash = await bcrypt.hash('TestPassword123', 10);
    const user = new User({
      tenantId,
      email: 'owner@example.com',
      passwordHash,
      firstName: 'Owner',
      lastName: 'User',
      role: 'owner',
    });
    await user.save();
    userId = user.id;
    tenant.ownerId = userId;
    await tenant.save();

    authHeader = getAuthHeader(userId, tenantId, 'owner');
  });

  describe('GET /api/v1/status', () => {
    it('should return statuses for the tenant', async () => {
      await new Status({
        tenantId,
        name: 'To Do',
        slug: 'to-do',
        color: '#6B7280',
        icon: 'circle',
        category: 'open',
        order: 0,
        isDefault: true,
      }).save();

      const res = await request(app).get('/api/v1/status').set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('To Do');
    });

    it('should require authentication', async () => {
      const res = await request(app).get('/api/v1/status');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/status', () => {
    it('should create a new status', async () => {
      const res = await request(app)
        .post('/api/v1/status')
        .set(authHeader)
        .send({
          name: 'In Review',
          color: '#F59E0B',
          category: 'in_progress',
          icon: 'eye',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('In Review');
      expect(res.body.data.isDefault).toBe(true); // First status becomes default
    });

    it('should reject duplicate status name', async () => {
      await request(app)
        .post('/api/v1/status')
        .set(authHeader)
        .send({ name: 'In Progress', color: '#3B82F6', category: 'in_progress' });

      const res = await request(app)
        .post('/api/v1/status')
        .set(authHeader)
        .send({ name: 'In Progress', color: '#FF0000', category: 'open' });

      expect(res.status).toBe(409);
    });
  });

  describe('PATCH /api/v1/status/:id', () => {
    it('should update a status name', async () => {
      const createRes = await request(app)
        .post('/api/v1/status')
        .set(authHeader)
        .send({ name: 'WIP', color: '#000', category: 'in_progress' });

      const statusId = createRes.body.data._id;
      const res = await request(app)
        .patch(`/api/v1/status/${statusId}`)
        .set(authHeader)
        .send({ name: 'Work In Progress' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Work In Progress');
    });
  });

  describe('DELETE /api/v1/status/:id', () => {
    it('should not allow deleting the only status', async () => {
      const createRes = await request(app)
        .post('/api/v1/status')
        .set(authHeader)
        .send({ name: 'Only Status', color: '#000', category: 'open' });

      const statusId = createRes.body.data._id;
      const res = await request(app)
        .delete(`/api/v1/status/${statusId}`)
        .set(authHeader);

      expect(res.status).toBe(409);
    });

    it('should allow deleting when multiple statuses exist', async () => {
      await request(app)
        .post('/api/v1/status')
        .set(authHeader)
        .send({ name: 'Status A', color: '#000', category: 'open' });

      const createRes = await request(app)
        .post('/api/v1/status')
        .set(authHeader)
        .send({ name: 'Status B', color: '#FFF', category: 'closed' });

      const statusId = createRes.body.data._id;
      const res = await request(app)
        .delete(`/api/v1/status/${statusId}`)
        .set(authHeader);

      expect(res.status).toBe(200);
    });
  });
});
