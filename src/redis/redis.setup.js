// At the very top of each file that runs in its own process
import { Redis } from 'ioredis';
let redis = undefined;
export async function initRedis() {
  if (redis) return redis;

  redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null, enableReadyCheck: false });
  redis.on('error', (error) => {
    console.error('REDIS ERROR:: ', error);
  });
  await redis.ping(); // fail early if needed
  console.log('Redis connected');

  return redis;
}

export const getRedis = () => {
  if (!redis) {
    throw new Error('Redis not intialized');
  }
  return redis;
};
