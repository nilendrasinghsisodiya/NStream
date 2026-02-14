import { User } from '../models/user.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { requestToken } from '../utils/otputils.js';
const requestAccoutDeletion = asyncHandler(async (req, res) => {
  const { userId } = req.user._id;
  await requestToken(userId, 'delete');
  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'we have sent you and email. please confirm you action.'));
});

const deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.user._id;
  const action = req.action;
  if (action != 'delete') {
    throw new ApiError(400, 'invalid or unauthorized token for this action');
  }
  await User.findByIdAndUpdate(userId, {
    $set: { deleted: true, deletedAt: Date.now() },
  });
  return res.status(200).json(new ApiResponse(200, {}, 'user deleted successfully'));
});
const verifyEmail = asyncHandler(async (req, res) => {
  const { userId } = req.user._id;
  const action = req.action;
  if (action != 'verifyEmail') {
    throw new ApiError(400, 'invalid or unauthorized token for this action');
  }

  await User.findByIdAndUpdate(userId, {
    $set: { isEmailVerified: true },
  });
  return res.status(200).json(new ApiResponse(200, {}, 'user email verified successfully'));
});
export { deleteUser, verifyEmail, requestAccoutDeletion };
