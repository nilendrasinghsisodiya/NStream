import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: path.resolve(__dirname, '../../../../.env.test'),
});

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
    quit: vi.fn(),
  }),
}));
