// At the very top of each file that runs in its own process
import { Queue } from 'bullmq';
import { getRedis } from '../redis/redis.setup.js';
export let otpQueue = undefined;

const redis = await getRedis();
try {
  otpQueue = new Queue('otpQueue', { connection: redis });
} catch (err) {
  console.log('messagequeue', err.message);
}
