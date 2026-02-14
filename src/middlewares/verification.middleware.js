import { User } from '../models/user.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { hashSecret, getTokenState, deleteToken } from '../utils/otputils.js';

export const verify = asyncHandler(async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers['authorization'] || req.body?.token;
    if (!token) {
      throw new ApiError(401, 'Unauthorized request');
    }
    const hashedToken = hashSecret(token);
    const tokenState = await getTokenState(token);
    if (!tokenState) {
      throw new ApiError(401, 'invalid or expired otToken');
    }
    req.action = tokenState.action;
    req.user = await User.findById(tokenState.userId);

    await deleteToken(hashedToken);
    next();
  } catch (error) {
    throw new ApiError(401, error.message || 'invalid otToken');
  }
});
