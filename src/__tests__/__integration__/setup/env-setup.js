console.log(process.env.NODE_ENV);

import { beforeAll, afterAll, vi } from 'vitest';
import mongoose from 'mongoose';

beforeAll(async () => {
  try {
    await mongoose.connect(process.env.mongoUri, { directConnection: true });

    console.log('MONGOOSE CONNECTED SUCCESSFULLY');
  } catch (err) {
    console.log('MONOGO CONNECTION FAILED', err);
  }
});

afterAll(async () => {
  try {
    await mongoose.disconnect();
    console.log('MONGOOSE DISCONNECTED SUCCESSFULLY');
  } catch (err) {
    console.log('MONGO DISCONNECT FAILED', err);
  }
});

vi.mock('bullmq', async () => {
  const actual = await vi.importActual('bullmq');

  return {
    ...actual,
    Queue: vi.fn().mockImplementation(function () {
      // `this.add` is a method on the instance
      this.add = vi.fn();
    }),
    Worker: vi.fn().mockImplementation(function () {
      this.close = vi.fn();
    }),
  };
});

vi.mock('../../../redis/redis.setup.js', () => ({
  getRedis: () => ({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    hset: vi.fn(),
    expire: vi.fn(),
    hexpire: vi.fn(),
    hdel: vi.fn(),
    quit: vi.fn(),
  }),
}));

vi.mock('../../../messageQueue/bullmq.setup.js', () => ({
  getOtpQueue: () => ({
    add: vi.fn(),
  }),
}));

vi.mock('fs', () => ({
  unlinkSync: vi.fn(),
}));

vi.mock('../../../utils/cloudinary.js', () => ({
  uploadOnCloudinary: vi
    .fn()
    .mockResolvedValue({ url: 'cdn://test.com/test.jpg', duration: 200, public_id: '1234' }),
  deleteFromCloudinary: vi.fn().mockResolvedValue({ result: 'ok' }),
}));
