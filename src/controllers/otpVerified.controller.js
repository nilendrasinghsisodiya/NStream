import { getRedis } from '../redis/redis.setup.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { hashSecret } from '../utils/otputils.js';
import { User } from '../models/user.model.js';

const resetPassword = asyncHandler(async (req, res) => {
  const token = req.cookies?.resetToken;

  if (!token) {
    throw new ApiError(401, 'unauthorized access');
  }

  const { newPassword } = req.body;
  const hashedToken = hashSecret(token);
  const redis = getRedis();
  const userId = redis.get(hashedToken);
  if (!userId) {
    throw new ApiError(403, 'invalid token');
  }
  await User.findByIdAndUpdate(userId, {
    $set: {
      password: newPassword,
    },
  });

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'deploy',
    sameSite: process.env.NODE_ENV === 'deploy' ? 'None' : 'lax',
  };

  return res
    .status(200)
    .resetCookie('resetToken', options)
    .json(new ApiResponse(200, {}, 'user password reset successfull'));
});

export { resetPassword };
