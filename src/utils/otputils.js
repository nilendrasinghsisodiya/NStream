import { getRedis } from '../redis/redis.setup.js';
import { getOtpQueue } from '../messageQueue/bullmq.setup.js';
import crypto from 'crypto';

const OTP_KEYS = ['userId', 'otp'];
const TOKEN_KEYS = ['userId', 'token', 'action'];
const populateOtp = (userId, otp) => {
  return { userId, otp };
};
const expireOtp = async (key, time, option = 'NX') => {
  const redis = getRedis();
  await redis.expire(key, time, option);
};
const expireToken = async (key, time, option = 'NX') => {
  const redis = getRedis();
  await redis.expire(key, time, option);
};

const deleteOtp = async (key) => {
  const redis = getRedis();
  await redis.hdel(key, ...OTP_KEYS);
};

const generateOtp = () => {
  // generates a random number between 100000 and 999999;
  return crypto.randomInt(100000, 1000000).toString();
};

const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const populateVerficationToken = (userId, token, action) => {
  if (!userId || !token || !action) {
    throw new Error('all arguments are required');
  }
  return { userId, token, action };
};

const hashSecret = (value) => {
  return crypto.createHmac('sha256', process.env.OTP_SECRET).update(value).digest('hex');
};
const deleteToken = async (key) => {
  const redis = getRedis();
  await redis.hdel(key, ...TOKEN_KEYS);
};

const getOtpState = async (key) => {
  const redis = getRedis();
  return await redis.hgetall(key);
};
const getTokenState = async (key) => {
  const redis = getRedis();
  return await redis.hgetall(key);
};

const requestToken = async (_id, action) => {
  const redis = getRedis();
  const otpQueue = getOtpQueue();
  const token = generateVerificationToken();
  const hashedToken = hashSecret(token);
  const tokenState = populateVerficationToken(_id, hashedToken, action);
  await otpQueue.add('otToken', { userId: _id, token, action });
  await redis.hset(hashedToken, tokenState);
  await expireToken(hashedToken, 60 * 30);
};

export {
  deleteOtp,
  getOtpState,
  getTokenState,
  expireToken,
  deleteToken,
  hashSecret,
  populateOtp,
  expireOtp,
  OTP_KEYS,
  generateOtp,
  generateVerificationToken,
  populateVerficationToken,
  requestToken,
};
