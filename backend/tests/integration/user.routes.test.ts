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

describe('User Routes Integration', () => {
  let tenantId: string;
  let userId: string;
  let memberId: string;
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
    memberId = member.id;

    authHeader = getAuthHeader(userId, tenantId, 'owner');
    memberAuthHeader = getAuthHeader(memberId, tenantId, 'member');
  });

  describe('GET /api/v1/users/me', () => {
    it('should return current user profile', async () => {
      const res = await request(app).get('/api/v1/users/me').set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('owner@example.com');
    });

    it('should require authentication', async () => {
      const res = await request(app).get('/api/v1/users/me');
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/v1/users/me', () => {
    it('should update own profile', async () => {
      const res = await request(app)
        .patch('/api/v1/users/me')
        .set(authHeader)
        .send({ firstName: 'Jane', lastName: 'Doe' });

      expect(res.status).toBe(200);
      expect(res.body.data.firstName).toBe('Jane');
      expect(res.body.data.lastName).toBe('Doe');
    });
  });

  describe('PATCH /api/v1/users/:id/role', () => {
    it('should allow owner to change member role to admin', async () => {
      const res = await request(app)
        .patch(`/api/v1/users/${memberId}/role`)
        .set(authHeader)
        .send({ role: 'admin' });

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('admin');
    });

    it('should deny assigning owner role', async () => {
      const res = await request(app)
        .patch(`/api/v1/users/${memberId}/role`)
        .set(authHeader)
        .send({ role: 'owner' });

      expect(res.status).toBe(403);
    });

    it('should deny changing own role', async () => {
      const res = await request(app)
        .patch(`/api/v1/users/${userId}/role`)
        .set(authHeader)
        .send({ role: 'admin' });

      expect(res.status).toBe(403);
    });

    it('should deny member from changing roles', async () => {
      const res = await request(app)
        .patch(`/api/v1/users/${userId}/role`)
        .set(memberAuthHeader)
        .send({ role: 'admin' });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('should allow owner to deactivate member', async () => {
      const res = await request(app)
        .delete(`/api/v1/users/${memberId}`)
        .set(authHeader);

      expect(res.status).toBe(200);
    });

    it('should deny deactivating self', async () => {
      const res = await request(app)
        .delete(`/api/v1/users/${userId}`)
        .set(authHeader);

      expect(res.status).toBe(403);
    });

    it('should deny member from deactivating others', async () => {
      const res = await request(app)
        .delete(`/api/v1/users/${userId}`)
        .set(memberAuthHeader);

      expect(res.status).toBe(403);
    });
  });
});
