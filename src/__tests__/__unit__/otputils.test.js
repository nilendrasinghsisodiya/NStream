import mongoose, { isValidObjectId } from 'mongoose';
import {
  populateOtp,
  generateOtp,
  hashSecret,
  generateVerificationToken,
  populateVerficationToken,
} from '../../utils/otputils.js';
import { describe, it, expect, beforeAll, vi } from 'vitest';
vi.mock('../../redis/redis.js', () => ({
  getRedis: () => ({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    quit: vi.fn(),
  }),
}));

vi.mock('bullmq', async () => {
  const actual = await vi.importActual('bullmq');
  return {
    ...actual,
    Queue: vi.fn().mockImplementation(() => ({
      add: vi.fn(),
    })),
    Worker: vi.fn(),
  };
});

describe('OTP utils', () => {
  let userId = undefined;
  let otp = undefined;
  let token = undefined;
  let otpState = undefined;
  let tokenState = undefined;
  let hashedToken = undefined;
  let hashedOtp = undefined;
  beforeAll(() => {
    process.env.OTP_SECRET = 'ajfkljdklfjaskldfjklasdjf34up4ujkljkljsafjkl';
    userId = new mongoose.Types.ObjectId();
    otp = generateOtp();
    token = generateVerificationToken();
    hashedOtp = hashSecret(otp);
    hashedToken = hashSecret(token);
    otpState = populateOtp(userId, otp);
    tokenState = populateVerficationToken(userId, token, 'DEL');
  });
  it('otp should be in range(100000,1000000)', () => {
    expect(otp).toBeTypeOf('string');
    expect(Number(otp)).toBeLessThan(1000000);
    expect(Number(otp)).toBeGreaterThanOrEqual(100000);
  });
  it('Otp state should be a valid', () => {
    expect(otpState.otp).toBe(otp);
    expect(isValidObjectId(otpState.userId.toString())).toBe(true);
  });
  it('Token state to have action DEL', () => {
    expect(tokenState.action).toBe('DEL');
  });
  it('Token State should have same userId', () => {
    expect(tokenState.userId).toBe(userId);
  });

  it('hashSecret should produce same result for otp', () => {
    expect(hashSecret(otp)).toBe(hashedOtp);
    expect(hashSecret(token)).toBe(hashedToken);
  });

  it('token should be of 32 byte long', () => {
    expect(token.length).toBe(64);
  });

  it('should have /^[a-f0-9]+$/ encoding', () => {
    expect(token).toMatch(/^[a-f0-9]+$/);
  });
});
