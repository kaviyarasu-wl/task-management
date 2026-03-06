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

describe('Project Routes Integration', () => {
  let tenantId: string;
  let userId: string;
  let authHeader: Record<string, string>;
  let memberAuthHeader: Record<string, string>;
  let memberId: string;

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
    memberId = member.id;

    // Create default statuses
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

    authHeader = getAuthHeader(userId, tenantId, 'owner');
    memberAuthHeader = getAuthHeader(memberId, tenantId, 'member');
  });

  describe('POST /api/v1/projects', () => {
    it('should create a project', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set(authHeader)
        .send({ name: 'Sprint 1', description: 'First sprint' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Sprint 1');
      expect(res.body.data.ownerId).toBe(userId);
    });

    it('should reject project without name', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set(authHeader)
        .send({ description: 'No name' });

      expect(res.status).toBe(400);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .send({ name: 'Unauthorized' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/projects', () => {
    it('should list projects for the tenant', async () => {
      await request(app).post('/api/v1/projects').set(authHeader).send({ name: 'Project 1' });
      await request(app).post('/api/v1/projects').set(authHeader).send({ name: 'Project 2' });

      const res = await request(app).get('/api/v1/projects').set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /api/v1/projects/:id', () => {
    it('should return a single project', async () => {
      const createRes = await request(app)
        .post('/api/v1/projects')
        .set(authHeader)
        .send({ name: 'My Project' });

      const projectId = createRes.body.data._id;
      const res = await request(app).get(`/api/v1/projects/${projectId}`).set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('My Project');
    });

    it('should return 404 for non-existent project', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app).get(`/api/v1/projects/${fakeId}`).set(authHeader);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/projects/:id', () => {
    it('should allow owner to update project', async () => {
      const createRes = await request(app)
        .post('/api/v1/projects')
        .set(authHeader)
        .send({ name: 'Original' });

      const projectId = createRes.body.data._id;
      const res = await request(app)
        .patch(`/api/v1/projects/${projectId}`)
        .set(authHeader)
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Name');
    });

    it('should deny member from updating non-owned project', async () => {
      const createRes = await request(app)
        .post('/api/v1/projects')
        .set(authHeader)
        .send({ name: 'Owner Project' });

      const projectId = createRes.body.data._id;
      const res = await request(app)
        .patch(`/api/v1/projects/${projectId}`)
        .set(memberAuthHeader)
        .send({ name: 'Hacked' });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/v1/projects/:id', () => {
    it('should soft delete project', async () => {
      const createRes = await request(app)
        .post('/api/v1/projects')
        .set(authHeader)
        .send({ name: 'To Delete' });

      const projectId = createRes.body.data._id;
      const res = await request(app)
        .delete(`/api/v1/projects/${projectId}`)
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should deny member from deleting non-owned project', async () => {
      const createRes = await request(app)
        .post('/api/v1/projects')
        .set(authHeader)
        .send({ name: 'Protected' });

      const projectId = createRes.body.data._id;
      const res = await request(app)
        .delete(`/api/v1/projects/${projectId}`)
        .set(memberAuthHeader);

      expect(res.status).toBe(403);
    });
  });
});
