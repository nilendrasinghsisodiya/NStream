//import '../__integration__/setup/global-setup.js';
import request from 'supertest';
import { createTestApp } from './setup/createApp.js';
import { describe, it, expect } from 'vitest';
import { isValidObjectId } from 'mongoose';

const app = createTestApp();
const suReq = request(app);

describe('Register Controller', () => {
  it('should register user', async () => {
    const res = await suReq.post('/auth/register').send({
      email: 'test@gmail.com',
      password: 'test12345',
      username: 'test12345',
    });
    expect(res.body.success).toBe(true);
    expect(isValidObjectId(res.body.data._id)).toBe(true);
    expect(res.body.data.email).toBe('test@gmail.com');
  });

  it('should throw 400', async () => {
    const res = await suReq.post('/auth/register').expect(400);
    expect(res.body.message).toBe('Validation failed');
  });
  it('should throw error', async () => {
    const res = await suReq
      .post('/auth/register')
      .send({ email: 'test@gmail.com', password: 'test12345', username: 'test12345' });
    expect(res.body.success).toBe(false);
    expect(res.status).toBe(409);
  });
});

describe('Login Controller', () => {
  it('should log user in', async () => {
    const res = await suReq
      .post('/auth/login')
      .send({ email: 'test@gmail.com', password: 'test12345' });
    expect(res.status).toBe(200);
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.length).toBeGreaterThan(0);
    expect(cookies[0]).toContain('accessToken=');
    expect(cookies[0]).toContain('HttpOnly');
  });
});
