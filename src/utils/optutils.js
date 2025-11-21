import { redis } from "../redis/redis.setup";

const OTP_KEYS = ["userId", "opt", "isVerified", "isUsed"];
const populateOtp = (userId, isVerified, isUsed, otp = 0) => {
  return { userId, otp, isVerified, isUsed };
};
const expireOtp = async (key, time, opt) => {
  await redis.hexpire(key, OTP_KEYS, time, opt);
};

export { populateOtp, expireOtp, OTP_KEYS };
