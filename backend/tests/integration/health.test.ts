import request from 'supertest';
import { createApp } from '../../src/app';
import express from 'express';

let app: express.Application;

beforeAll(async () => {
  app = await createApp();
});

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok' });
  });
});

describe('GET /unknown-route', () => {
  it('returns 404', async () => {
    const res = await request(app).get('/api/v1/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });
});
