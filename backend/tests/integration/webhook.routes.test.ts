import request from 'supertest';
import express from 'express';
import { createApp } from '../../src/app';
import { setupTestDb, teardownTestDb, clearTestDb } from '../helpers/testDb';
import { clearMockRedis, resetMockRedis } from '../helpers/testRedis';
import { getAuthHeader } from '../helpers/authHelpers';
import { Tenant } from '../../src/modules/tenant/tenant.model';
import { User } from '../../src/modules/user/user.model';
import bcrypt from 'bcryptjs';

jest.mock('../../src/infrastructure/redis/client', () => {
  const { createMockRedis: createRedis } = require('../helpers/testRedis');
  return { getRedisClient: () => createRedis() };
});

let app: express.Application;

describe('Webhook Routes Integration', () => {
  let tenantId: string;
  let userId: string;
  let authHeader: Record<string, string>;
  let memberAuthHeader: Record<string, string>;

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

    const member = new User({
      tenantId,
      email: 'member@example.com',
      passwordHash,
      firstName: 'Member',
      lastName: 'User',
      role: 'member',
    });
    await member.save();

    authHeader = getAuthHeader(userId, tenantId, 'owner');
    memberAuthHeader = getAuthHeader(member.id, tenantId, 'member');
  });

  describe('POST /api/v1/webhooks', () => {
    it('should create a webhook', async () => {
      const res = await request(app)
        .post('/api/v1/webhooks')
        .set(authHeader)
        .send({
          name: 'Test Webhook',
          url: 'https://example.com/hook',
          events: ['task.created'],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Test Webhook');
      expect(res.body.data.secret).toBeDefined();
    });

    it('should reject webhook without name', async () => {
      const res = await request(app)
        .post('/api/v1/webhooks')
        .set(authHeader)
        .send({
          url: 'https://example.com/hook',
          events: ['task.created'],
        });

      expect(res.status).toBe(400);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/v1/webhooks')
        .send({ name: 'Webhook', url: 'https://example.com', events: ['task.created'] });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/webhooks', () => {
    it('should list webhooks for the tenant', async () => {
      await request(app)
        .post('/api/v1/webhooks')
        .set(authHeader)
        .send({ name: 'Webhook 1', url: 'https://example.com/1', events: ['task.created'] });

      const res = await request(app).get('/api/v1/webhooks').set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('PATCH /api/v1/webhooks/:id', () => {
    it('should allow admin to update webhook', async () => {
      const createRes = await request(app)
        .post('/api/v1/webhooks')
        .set(authHeader)
        .send({ name: 'Original', url: 'https://example.com', events: ['task.created'] });

      const webhookId = createRes.body.data._id;
      const res = await request(app)
        .patch(`/api/v1/webhooks/${webhookId}`)
        .set(authHeader)
        .send({ name: 'Updated Webhook' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Webhook');
    });

    it('should deny member from updating', async () => {
      const createRes = await request(app)
        .post('/api/v1/webhooks')
        .set(authHeader)
        .send({ name: 'Protected', url: 'https://example.com', events: ['task.created'] });

      const webhookId = createRes.body.data._id;
      const res = await request(app)
        .patch(`/api/v1/webhooks/${webhookId}`)
        .set(memberAuthHeader)
        .send({ name: 'Hacked' });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/v1/webhooks/:id', () => {
    it('should soft delete webhook', async () => {
      const createRes = await request(app)
        .post('/api/v1/webhooks')
        .set(authHeader)
        .send({ name: 'To Delete', url: 'https://example.com', events: ['task.created'] });

      const webhookId = createRes.body.data._id;
      const res = await request(app)
        .delete(`/api/v1/webhooks/${webhookId}`)
        .set(authHeader);

      expect(res.status).toBe(200);
    });

    it('should deny member from deleting', async () => {
      const createRes = await request(app)
        .post('/api/v1/webhooks')
        .set(authHeader)
        .send({ name: 'Protected', url: 'https://example.com', events: ['task.created'] });

      const webhookId = createRes.body.data._id;
      const res = await request(app)
        .delete(`/api/v1/webhooks/${webhookId}`)
        .set(memberAuthHeader);

      expect(res.status).toBe(403);
    });
  });
});
