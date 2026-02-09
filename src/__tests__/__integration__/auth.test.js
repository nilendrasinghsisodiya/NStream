//import '../__integration__/setup/global-setup.js';
import request from 'supertest';
import { createTestApp } from './setup/createApp.js';
import { describe, it, expect, beforeAll } from 'vitest';
import { isValidObjectId } from 'mongoose';
import { logInAgent } from './setup/agentWithCookies.js';
const app = createTestApp();
const suReq = request(app);

describe('Register Controller', () => {
  it('should register user', async () => {
    const res = await suReq.post('/auth/register').send({
      email: 'authtest@gmail.com',
      password: 'authtest12345',
      username: 'authtest12345',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(isValidObjectId(res.body.data._id)).toBe(true);
    expect(res.body.data.email).toBe('authtest@gmail.com');
  });

  it('should throw 400 as it lacks valid input fields', async () => {
    const res = await suReq.post('/auth/register').expect(400);
    expect(res.body.message).toBe('A Request body is required');
  });
  it('should throw error because a user with these email or username exist', async () => {
    const res = await suReq
      .post('/auth/register')
      .send({ email: 'authtest@gmail.com', password: 'authtest12345', username: 'authtest12345' });
    expect(res.body.success).toBe(false);
    expect(res.status).toBe(409);
  });
});

describe('Login Controller', () => {
  it('should log user in', async () => {
    const res = await suReq
      .post('/auth/login')
      .send({ email: 'authtest@gmail.com', password: 'authtest12345' });
    expect(res.status).toBe(200);
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.length).toBeGreaterThan(0);
    expect(cookies[0]).toContain('accessToken=');
    expect(cookies[0]).toContain('HttpOnly');
  });

  it('should throw error as it lacks input fields', async () => {
    const res = await suReq.post('/auth/login').expect(400);
    expect(res.body.data).toBeUndefined();
  });
});

describe('Log out user', () => {
  let agent = undefined;
  beforeAll(async () => {
    agent = request.agent(app);
    await logInAgent(agent, { email: 'authtest@gmail.com', password: 'authtest12345' });
  });
  it('should log out user and clear cookies', async () => {
    const res = await agent.post('/auth/logout').expect(204);
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.length).toBeGreaterThan(0);
    expect(cookies[0].accessToken).toBeUndefined();
    expect(cookies[0].refreshToken).toBeUndefined();
    expect(cookies[0]).toContain('HttpOnly');
  });
});
