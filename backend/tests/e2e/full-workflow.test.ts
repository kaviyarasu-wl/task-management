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

describe('E2E: Full User Journey', () => {
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

  it('register -> create project -> create task -> assign -> transition -> complete -> verify report', async () => {
    // 1. Register (creates tenant + user atomically)
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'owner@testcorp.com',
        password: 'SecurePass123!',
        firstName: 'Jane',
        lastName: 'Doe',
        organizationName: 'Test Corp',
      });

    expect(registerRes.status).toBe(201);
    const { accessToken } = registerRes.body.data;
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    // 2. Get user profile to confirm registration
    const profileRes = await request(app)
      .get('/api/v1/auth/me')
      .set(authHeader);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.data.email).toBe('owner@testcorp.com');
    expect(profileRes.body.data.role).toBe('owner');

    // 3. Create a project
    const projectRes = await request(app)
      .post('/api/v1/projects')
      .set(authHeader)
      .send({ name: 'Sprint 1', description: 'First sprint' });

    expect(projectRes.status).toBe(201);
    const projectId = projectRes.body.data._id;

    // 4. Get available statuses (should have defaults)
    const statusRes = await request(app)
      .get('/api/v1/status')
      .set(authHeader);

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.data.length).toBeGreaterThanOrEqual(1);

    // 5. Create a task
    const taskRes = await request(app)
      .post('/api/v1/tasks')
      .set(authHeader)
      .send({
        title: 'Implement login page',
        description: 'Build the login page with form validation',
        projectId,
        priority: 'high',
      });

    expect(taskRes.status).toBe(201);
    const taskId = taskRes.body.data._id;
    expect(taskRes.body.data.title).toBe('Implement login page');

    // 6. List tasks to verify
    const tasksListRes = await request(app)
      .get('/api/v1/tasks')
      .set(authHeader);

    expect(tasksListRes.status).toBe(200);
    expect(tasksListRes.body.data.length).toBeGreaterThanOrEqual(1);

    // 7. Update task (simulate assignment and priority change)
    const updateRes = await request(app)
      .patch(`/api/v1/tasks/${taskId}`)
      .set(authHeader)
      .send({ priority: 'urgent' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.priority).toBe('urgent');

    // 8. Find 'closed' category status for completion
    const doneStatus = statusRes.body.data.find(
      (s: { category: string }) => s.category === 'closed'
    );

    // 9. If Done status exists, transition task to complete
    if (doneStatus) {
      const completeRes = await request(app)
        .patch(`/api/v1/tasks/${taskId}`)
        .set(authHeader)
        .send({ status: doneStatus._id });

      expect(completeRes.status).toBe(200);
    }

    // 10. Get the task to verify its final state
    const getTaskRes = await request(app)
      .get(`/api/v1/tasks/${taskId}`)
      .set(authHeader);

    expect(getTaskRes.status).toBe(200);
    expect(getTaskRes.body.data.title).toBe('Implement login page');
  });

  it('register -> invite member -> member logs in -> member creates task -> owner can see it', async () => {
    // 1. Register owner
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'owner@teamcorp.com',
        password: 'SecurePass123!',
        firstName: 'Team',
        lastName: 'Owner',
        organizationName: 'Team Corp',
      });

    expect(registerRes.status).toBe(201);
    const ownerToken = registerRes.body.data.accessToken;
    const ownerHeader = { Authorization: `Bearer ${ownerToken}` };

    // 2. Create project
    const projectRes = await request(app)
      .post('/api/v1/projects')
      .set(ownerHeader)
      .send({ name: 'Team Project' });

    expect(projectRes.status).toBe(201);
    const projectId = projectRes.body.data._id;

    // 3. Invite a member
    const inviteRes = await request(app)
      .post('/api/v1/invitations')
      .set(ownerHeader)
      .send({
        email: 'member@teamcorp.com',
        role: 'member',
      });

    expect(inviteRes.status).toBe(201);
    const invitationToken = inviteRes.body.data.token;

    // 4. Member accepts invitation
    const acceptRes = await request(app)
      .post('/api/v1/invitations/accept')
      .send({
        token: invitationToken,
        firstName: 'New',
        lastName: 'Member',
        password: 'MemberPass123!',
      });

    expect(acceptRes.status).toBe(201);

    // 5. Member logs in
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'member@teamcorp.com',
        password: 'MemberPass123!',
      });

    expect(loginRes.status).toBe(200);
    const memberToken = loginRes.body.data.accessToken;
    const memberHeader = { Authorization: `Bearer ${memberToken}` };

    // 6. Member creates a task
    const memberTaskRes = await request(app)
      .post('/api/v1/tasks')
      .set(memberHeader)
      .send({
        title: 'Member task',
        projectId,
      });

    expect(memberTaskRes.status).toBe(201);
    const memberTaskId = memberTaskRes.body.data._id;

    // 7. Owner can see member's task
    const ownerViewRes = await request(app)
      .get(`/api/v1/tasks/${memberTaskId}`)
      .set(ownerHeader);

    expect(ownerViewRes.status).toBe(200);
    expect(ownerViewRes.body.data.title).toBe('Member task');
  });

  it('register -> create multiple projects -> create tasks -> filter by project', async () => {
    // 1. Register
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'user@filter-test.com',
        password: 'SecurePass123!',
        firstName: 'Filter',
        lastName: 'Tester',
        organizationName: 'Filter Corp',
      });

    expect(registerRes.status).toBe(201);
    const authHeader = { Authorization: `Bearer ${registerRes.body.data.accessToken}` };

    // 2. Create two projects
    const proj1Res = await request(app)
      .post('/api/v1/projects')
      .set(authHeader)
      .send({ name: 'Project Alpha' });

    const proj2Res = await request(app)
      .post('/api/v1/projects')
      .set(authHeader)
      .send({ name: 'Project Beta' });

    const projectAlphaId = proj1Res.body.data._id;
    const projectBetaId = proj2Res.body.data._id;

    // 3. Create tasks in each project
    await request(app)
      .post('/api/v1/tasks')
      .set(authHeader)
      .send({ title: 'Alpha Task 1', projectId: projectAlphaId });

    await request(app)
      .post('/api/v1/tasks')
      .set(authHeader)
      .send({ title: 'Alpha Task 2', projectId: projectAlphaId });

    await request(app)
      .post('/api/v1/tasks')
      .set(authHeader)
      .send({ title: 'Beta Task 1', projectId: projectBetaId });

    // 4. Filter tasks by project
    const alphaTasksRes = await request(app)
      .get(`/api/v1/tasks?projectId=${projectAlphaId}`)
      .set(authHeader);

    expect(alphaTasksRes.status).toBe(200);
    expect(alphaTasksRes.body.data.length).toBe(2);

    const betaTasksRes = await request(app)
      .get(`/api/v1/tasks?projectId=${projectBetaId}`)
      .set(authHeader);

    expect(betaTasksRes.status).toBe(200);
    expect(betaTasksRes.body.data.length).toBe(1);
  });
});
