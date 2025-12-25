//import './setup/global-setup.js';
import { describe, it, expect, beforeAll } from 'vitest';
import { createTestApp } from './setup/createApp.js';
import request from 'supertest';

const app = createTestApp();
const agent = request.agent(app);

describe('User Controller', () => {
  beforeAll(async () => {
    await agent.post('/auth/login').send({ email: 'test@gmail.com' });
  });
  it('throw error', async () => {
    const res = await agent.put('/user/create').send({});
    // should fail as this lacks auth info like accessToken
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
