// At the very top of each file that runs in its own process
import { Queue } from 'bullmq';
import { getRedis } from '../redis/redis.setup.js';
let otpQueue = undefined;

const initOtpQueue = async () => {
  if (otpQueue) return otpQueue;
  const redis = await getRedis();
  try {
    otpQueue = new Queue('otpQueue', { connection: redis });
  } catch (err) {
    console.error('messagequeue', err.message);
  }
};

const getOtpQueue = () => {
  if (!otpQueue) throw new Error('otp queue not initialized');
  return otpQueue;
};

export { getOtpQueue, initOtpQueue };
