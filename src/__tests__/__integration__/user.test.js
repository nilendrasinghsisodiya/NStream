import { describe, it, expect, beforeAll, vi } from 'vitest';
import { seedFreshUser } from './setup/seedData/seedUser.js';
import { getAgent, logInAgent } from './setup/agentWithCookies.js';
import request from 'supertest';
import { createTestApp } from './setup/createApp.js';
import { getDir } from '../../utils/fileUtils.js';
const __dirname = getDir(import.meta.url);
import path from 'node:path';
import { uploadOnCloudinary } from '../../utils/cloudinary.js';
import jwt from 'jsonwebtoken';
const agent = getAgent();
const app = createTestApp();
describe('User Controller', () => {
  let expiredToken = undefined;
  let refreshToken = undefined;
  let seededUser = undefined;
  beforeAll(async () => {
    seededUser = await seedFreshUser();
    await logInAgent(agent, { email: 'freshUser@test.com', password: 'freshUser' });
    expiredToken = jwt.sign({ _id: 'test' }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: '-10',
    });
    refreshToken = jwt.sign({ _id: seededUser._id }, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: '1d',
    });
  });

  it('should throw error because it lacks valid input field', async () => {
    const res = await agent.put('/user/create').send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('wrong input fields');
    expect(res.body.data.errors).toBeInstanceOf(Array);
    expect(res.body.success).toBe(false);
  });

  it('should create user ( put user info)', async () => {
    // learn how to attach file in super test
    // .attch with absolute path __dirname + pathname
    // now it should run if the first one passes this sould pass too
    //
    const avatarPath = path.resolve(__dirname, './testData/test.jpg');
    const res = await agent
      .put('/user/create')
      .field('description', 'this is a test user created by ci')
      .field('fullname', 'fresh user')
      .attach('avatar', avatarPath);
    expect(res.status).toBe(200);
    const data = res.body.data;
    expect(data).toBeDefined();
    expect(data.description).toBeDefined();
    expect(data.description).toBe('this is a test user created by ci');
    expect(data.fullname).toBeDefined();
    expect(data.fullname).toBe('fresh user');
    expect(data.username).toBeDefined();
    expect(data.avatar).toBeDefined();
    expect(data.avatar).toBe('cdn://test.com/test.jpg'); //mocked value for cloudinary
    expect(data.isProfileComplete).toBeDefined();
    expect(data.isProfileComplete).toBe(true);
  });
  it('should update username for the user freshUser to userTest ', async () => {
    const res = await agent
      .patch('/user/update-account')
      .send({ fullname: 'updated Test User' })
      .expect(200);
    expect(res.status).toBe(200);
    expect(res.body.data.fullname).toBeDefined();
    expect(res.body.data.fullname).toBe('updated Test User');
  });
  it('should update  user avatar for user', async () => {
    vi.mocked(uploadOnCloudinary).mockResolvedValue({
      url: 'cdn://test.com/test2.jpg',
      public_id: 'test2',
    });
    const avatarPath = path.resolve(__dirname, './testData/test.jpg');

    const res = await agent.patch('/user/avatar').attach('avatar', avatarPath).expect(200);
    expect(res.body.data.avatar).toBeDefined();
    expect(res.body.data.avatar).toBe('cdn://test.com/test2.jpg');
  });
  it('should update description for user', async () => {
    const res = await agent
      .patch('/user/update-account')
      .send({ description: 'this is updated test user description' })
      .expect(200);
    expect(res.status).toBe(200);
    expect(res.body.data.description).toBeDefined();
    expect(res.body.data.description).toBe('this is updated test user description');
  });
  it('should update fullname and description for user', async () => {
    const res = await agent
      .patch('/user/update-account')
      .send({ fullname: 'updated fullname', description: 'this is updated description' })
      .expect(200);
    expect(res.body.data.fullname).toBeDefined();
    expect(res.body.data.fullname).toBe('updated fullname');
    expect(res.body.data.description).toBeDefined();
    expect(res.body.data.description).toBe('this is updated description');
  });
  it('should throw errors because no input fields were provided for updation', async () => {
    const res = await agent.patch('/user/update-account').expect(400);
    expect(res.body.message).toBe('A Request body is required');
  });

  it('should throw 493', async () => {
    const res = await request(app)
      .patch('/user/update-account')
      .set('Cookie', `accessToken=${expiredToken}`)
      .send({ email: 'abc' }); // gibirish
    expect(res.status).toBe(493);
  });
  it('should refresh accessToken throw an error because  a duplicate refresh token was used', async () => {
    await request(app)
      .post('/auth/refresh-access-token')
      .set('Cookie', `refreshToken:${refreshToken}`)
      .expect(401);
  });
  it('should refresh accessToken for the user', async () => {
    const res = await agent.post('/auth/refresh-access-token').expect(200);
    const cookies = res.headers['set-cookie'];
    expect(cookies[0]).toContain('accessToken');
    expect(cookies[0]).toContain('HttpOnly');
    expect(cookies[0]).toContain('SameSite');
  });
  it('should mark user as delete', async () => {});
});
