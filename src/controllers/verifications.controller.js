import { getRedis } from '../redis/redis.setup.js';
import { getOtpQueue } from '../messageQueue/bullmq.setup.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { User } from '../models/user.model.js';
import {
  generateOtp,
  hashSecret,
  expireOtp,
  getOtpState,
  deleteOtp,
  populateOtp,
  generateVerificationToken,
} from '../utils/otputils.js';
const getOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new ApiError(400, 'empty email');
  }
  const user = User.findOne({ email: email });
  if (!user) {
    throw new ApiError(404, 'no user associated with this email found');
  }
  const redis = getRedis();
  const otpQueue = getOtpQueue();
  const otp = generateOtp();
  const hashedOtp = hashSecret(otp);
  const key = `otp::pr::${hashedOtp}`;
  const otpState = populateOtp(user._id, hashedOtp);
  await redis.hset(key, otpState);
  await expireOtp(key, 600);
  await otpQueue.add('otp', {
    usermail: email,
    otp: otp,
  });
  return res.status(200).json(new ApiResponse(200, {}, 'opt generated sucessfully'));
});
const verifyOtp = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  const hashedOtp = hashSecret(otp);
  const key = `otp::pr::${hashedOtp}`;
  const otpState = await getOtpState(key);
  if (!otpState) {
    throw new ApiError(400, 'expired otp');
  }
  if (hashedOtp === otpState.otp) {
    const redis = getRedis();
    await deleteOtp(key);
    const token = generateVerificationToken();
    const hashedToken = hashSecret(token);
    await redis.set(hashedToken, otpState.userId);
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'deploy',
      sameSite: 'lax',
    };

    return res
      .status(200)
      .cookie('resetToken', token, options)
      .json(new ApiResponse(200, {}, 'verification successfull'));
  }
  throw new ApiError(400, 'invalid otp or expired otp');
});

export { getOtp, verifyOtp };
