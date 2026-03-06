import request from 'supertest';
import express from 'express';
import { createApp } from '../../src/app';
import { setupTestDb, teardownTestDb, clearTestDb } from '../helpers/testDb';
import { clearMockRedis, resetMockRedis } from '../helpers/testRedis';

jest.mock('../../src/infrastructure/redis/client', () => {
  const { createMockRedis: createRedis } = require('../helpers/testRedis');
  return { getRedisClient: () => createRedis() };
});

let app: express.Application;

describe('E2E: Multi-Tenant Isolation', () => {
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
  });

  it('tenant A data is not visible to tenant B', async () => {
    // 1. Register Tenant A
    const tenantARes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'admin@tenant-a.com',
        password: 'SecurePass123!',
        firstName: 'Admin',
        lastName: 'TenantA',
        organizationName: 'Tenant A Corp',
      });

    expect(tenantARes.status).toBe(201);
    const tenantAHeader = { Authorization: `Bearer ${tenantARes.body.data.accessToken}` };

    // 2. Register Tenant B
    const tenantBRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'admin@tenant-b.com',
        password: 'SecurePass456!',
        firstName: 'Admin',
        lastName: 'TenantB',
        organizationName: 'Tenant B Corp',
      });

    expect(tenantBRes.status).toBe(201);
    const tenantBHeader = { Authorization: `Bearer ${tenantBRes.body.data.accessToken}` };

    // 3. Tenant A creates a project
    const projRes = await request(app)
      .post('/api/v1/projects')
      .set(tenantAHeader)
      .send({ name: 'Secret Project A' });

    expect(projRes.status).toBe(201);
    const projectAId = projRes.body.data._id;

    // 4. Tenant A creates a task
    const taskRes = await request(app)
      .post('/api/v1/tasks')
      .set(tenantAHeader)
      .send({
        title: 'Tenant A Secret Task',
        projectId: projectAId,
        priority: 'high',
      });

    expect(taskRes.status).toBe(201);
    const taskAId = taskRes.body.data._id;

    // 5. Tenant B tries to list tasks — should see NONE from Tenant A
    const tenantBTasksRes = await request(app)
      .get('/api/v1/tasks')
      .set(tenantBHeader);

    expect(tenantBTasksRes.status).toBe(200);
    expect(tenantBTasksRes.body.data.length).toBe(0);

    // 6. Tenant B tries to access Tenant A's task by ID — should get 404
    const crossTenantRes = await request(app)
      .get(`/api/v1/tasks/${taskAId}`)
      .set(tenantBHeader);

    expect(crossTenantRes.status).toBe(404);

    // 7. Tenant B tries to list projects — should see NONE from Tenant A
    const tenantBProjectsRes = await request(app)
      .get('/api/v1/projects')
      .set(tenantBHeader);

    expect(tenantBProjectsRes.status).toBe(200);
    const tenantBProjects = tenantBProjectsRes.body.data;
    const hasProjectA = Array.isArray(tenantBProjects)
      ? tenantBProjects.some((p: { name: string }) => p.name === 'Secret Project A')
      : false;
    expect(hasProjectA).toBe(false);

    // 8. Tenant B tries to access Tenant A's project — should get 404
    const crossProjectRes = await request(app)
      .get(`/api/v1/projects/${projectAId}`)
      .set(tenantBHeader);

    expect(crossProjectRes.status).toBe(404);

    // 9. Verify Tenant A can still see their own data
    const tenantATasksRes = await request(app)
      .get('/api/v1/tasks')
      .set(tenantAHeader);

    expect(tenantATasksRes.status).toBe(200);
    expect(tenantATasksRes.body.data.length).toBe(1);
    expect(tenantATasksRes.body.data[0].title).toBe('Tenant A Secret Task');
  });

  it('tenant A statuses are independent from tenant B', async () => {
    // 1. Register both tenants
    const tenantARes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'owner@statustest-a.com',
        password: 'SecurePass123!',
        firstName: 'OwnerA',
        lastName: 'Status',
        organizationName: 'StatusTest A',
      });
    const tenantAHeader = { Authorization: `Bearer ${tenantARes.body.data.accessToken}` };

    const tenantBRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'owner@statustest-b.com',
        password: 'SecurePass123!',
        firstName: 'OwnerB',
        lastName: 'Status',
        organizationName: 'StatusTest B',
      });
    const tenantBHeader = { Authorization: `Bearer ${tenantBRes.body.data.accessToken}` };

    // 2. Both tenants should have their own default statuses
    const tenantAStatuses = await request(app).get('/api/v1/status').set(tenantAHeader);
    const tenantBStatuses = await request(app).get('/api/v1/status').set(tenantBHeader);

    expect(tenantAStatuses.status).toBe(200);
    expect(tenantBStatuses.status).toBe(200);

    // 3. Tenant A creates a custom status
    const customStatusRes = await request(app)
      .post('/api/v1/status')
      .set(tenantAHeader)
      .send({ name: 'Peer Review', color: '#9333EA', category: 'in_progress' });

    expect(customStatusRes.status).toBe(201);

    // 4. Tenant B should NOT see Tenant A's custom status
    const tenantBStatusesAfter = await request(app).get('/api/v1/status').set(tenantBHeader);
    const hasPeerReview = tenantBStatusesAfter.body.data.some(
      (s: { name: string }) => s.name === 'Peer Review'
    );
    expect(hasPeerReview).toBe(false);
  });

  it('tenant B cannot modify tenant A resources', async () => {
    // 1. Register both tenants
    const tenantARes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'owner@mod-a.com',
        password: 'SecurePass123!',
        firstName: 'OwnerA',
        lastName: 'Mod',
        organizationName: 'Mod Corp A',
      });
    const tenantAHeader = { Authorization: `Bearer ${tenantARes.body.data.accessToken}` };

    const tenantBRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'owner@mod-b.com',
        password: 'SecurePass123!',
        firstName: 'OwnerB',
        lastName: 'Mod',
        organizationName: 'Mod Corp B',
      });
    const tenantBHeader = { Authorization: `Bearer ${tenantBRes.body.data.accessToken}` };

    // 2. Tenant A creates a project and task
    const projRes = await request(app)
      .post('/api/v1/projects')
      .set(tenantAHeader)
      .send({ name: 'A Project' });

    const projectId = projRes.body.data._id;

    const taskRes = await request(app)
      .post('/api/v1/tasks')
      .set(tenantAHeader)
      .send({ title: 'A Task', projectId });

    const taskId = taskRes.body.data._id;

    // 3. Tenant B tries to update Tenant A's task — should fail
    const updateRes = await request(app)
      .patch(`/api/v1/tasks/${taskId}`)
      .set(tenantBHeader)
      .send({ title: 'Hacked Title' });

    expect(updateRes.status).toBe(404);

    // 4. Tenant B tries to delete Tenant A's task — should fail
    const deleteRes = await request(app)
      .delete(`/api/v1/tasks/${taskId}`)
      .set(tenantBHeader);

    expect(deleteRes.status).toBe(404);

    // 5. Verify Tenant A's task is unchanged
    const verifyRes = await request(app)
      .get(`/api/v1/tasks/${taskId}`)
      .set(tenantAHeader);

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.title).toBe('A Task');
  });
});
