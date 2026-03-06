import request from 'supertest';
import express from 'express';
import { createApp } from '../../src/app';
import { setupTestDb, teardownTestDb, clearTestDb } from '../helpers/testDb';
import { clearMockRedis, resetMockRedis } from '../helpers/testRedis';
import { getAuthHeader } from '../helpers/authHelpers';
import { Tenant } from '../../src/modules/tenant/tenant.model';
import { User } from '../../src/modules/user/user.model';
import { Project } from '../../src/modules/project/project.model';
import { Status } from '../../src/modules/status/status.model';
import { Task } from '../../src/modules/task/task.model';
import bcrypt from 'bcryptjs';

jest.mock('../../src/infrastructure/redis/client', () => {
  const { createMockRedis: createRedis } = require('../helpers/testRedis');
  return { getRedisClient: () => createRedis() };
});

let app: express.Application;

describe('Comment Routes Integration', () => {
  let tenantId: string;
  let userId: string;
  let taskId: string;
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

    const project = new Project({
      tenantId,
      name: 'Test Project',
      ownerId: userId,
      memberIds: [userId, member.id],
    });
    await project.save();

    const status = new Status({
      tenantId,
      name: 'To Do',
      slug: 'to-do',
      color: '#6B7280',
      icon: 'circle',
      category: 'open',
      order: 0,
      isDefault: true,
    });
    await status.save();

    const task = new Task({
      tenantId,
      title: 'Test Task',
      projectId: project.id,
      reporterId: userId,
      status: status.id,
    });
    await task.save();
    taskId = task.id;

    authHeader = getAuthHeader(userId, tenantId, 'owner');
    memberAuthHeader = getAuthHeader(member.id, tenantId, 'member');
  });

  describe('POST /api/v1/tasks/:taskId/comments', () => {
    it('should create a comment on a task', async () => {
      const res = await request(app)
        .post(`/api/v1/tasks/${taskId}/comments`)
        .set(authHeader)
        .send({ content: 'This is a test comment' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe('This is a test comment');
    });

    it('should reject empty content', async () => {
      const res = await request(app)
        .post(`/api/v1/tasks/${taskId}/comments`)
        .set(authHeader)
        .send({ content: '' });

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent task', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .post(`/api/v1/tasks/${fakeId}/comments`)
        .set(authHeader)
        .send({ content: 'Comment on ghost task' });

      expect(res.status).toBe(404);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post(`/api/v1/tasks/${taskId}/comments`)
        .send({ content: 'Unauthorized comment' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/tasks/:taskId/comments', () => {
    it('should list comments for a task', async () => {
      await request(app)
        .post(`/api/v1/tasks/${taskId}/comments`)
        .set(authHeader)
        .send({ content: 'Comment 1' });

      await request(app)
        .post(`/api/v1/tasks/${taskId}/comments`)
        .set(authHeader)
        .send({ content: 'Comment 2' });

      const res = await request(app)
        .get(`/api/v1/tasks/${taskId}/comments`)
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('PATCH /api/v1/comments/:id', () => {
    it('should allow author to update comment', async () => {
      const createRes = await request(app)
        .post(`/api/v1/tasks/${taskId}/comments`)
        .set(authHeader)
        .send({ content: 'Original' });

      const commentId = createRes.body.data._id;
      const res = await request(app)
        .patch(`/api/v1/comments/${commentId}`)
        .set(authHeader)
        .send({ content: 'Updated content' });

      expect(res.status).toBe(200);
      expect(res.body.data.content).toBe('Updated content');
    });

    it('should deny non-author member from updating', async () => {
      const createRes = await request(app)
        .post(`/api/v1/tasks/${taskId}/comments`)
        .set(authHeader)
        .send({ content: 'Owner comment' });

      const commentId = createRes.body.data._id;
      const res = await request(app)
        .patch(`/api/v1/comments/${commentId}`)
        .set(memberAuthHeader)
        .send({ content: 'Hacked' });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/v1/comments/:id', () => {
    it('should allow author to delete comment', async () => {
      const createRes = await request(app)
        .post(`/api/v1/tasks/${taskId}/comments`)
        .set(authHeader)
        .send({ content: 'To delete' });

      const commentId = createRes.body.data._id;
      const res = await request(app)
        .delete(`/api/v1/comments/${commentId}`)
        .set(authHeader);

      expect(res.status).toBe(200);
    });
  });
});
