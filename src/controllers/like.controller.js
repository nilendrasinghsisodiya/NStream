import { User } from '../models/user.model.js';
import { Video } from '../models/video.model.js';
import { Like } from '../models/like.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { isValidObjectId } from 'mongoose';
import { mongodbId } from '../utils/additionalUtils.js';
const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.body;
  // check if video with this id exist of not
  let message = '';

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, 'Invalid Video id');
  }
  const userId = req?.user?._id;
  const existingLike = await Like.findOne({
    likedBy: userId,
    video: mongodbId(videoId),
  });

  if (!existingLike) {
    const like = await Like.create({
      likedBy: userId,
      video: mongodbId(videoId),
    });
    Video.findByIdAndUpdate({ _id: mongodbId(videoId) }, { $inc: { likesCount: 1 } });
    if (!like) {
      throw new ApiError(400, ' Failed to like the video');
    }
    message = 'video liked sucessfully';
  } else {
    await Like.deleteOne({ _id: existingLike._id });
    Video.findByIdAndUpdate({ _id: mongodbId(videoId) }, { $inc: { likesCount: -1 } });
    message = 'video disLiked sucessfully';
  }
  return res.status(200).json(new ApiResponse(200, {}, message));
});
const toggleCommentLike = asyncHandler(async (req, res) => {
  const { targetId } = req.body;
  const userId = req?.user?._id;

  if (!targetId) {
    throw new ApiError('invalid or empty targetId');
  }
  const liked = await Like.findOne({
    comment: targetId,
    likedBy: userId,
  });

  if (!liked) {
    const like = await Like.create({
      comment: targetId,
      likedBy: userId,
    });

    if (!like) {
      throw new ApiError(500, 'failed to like the comment');
    }
    return res.status(200).json(new ApiResponse(200, {}, 'comment liked sucessfully'));
  } else {
    const like = await Like.deleteOne({ likedBy: userId });
    if (!like) {
      throw new ApiError(500, 'failed to unlike comment');
    }

    return res.status(200).json(new ApiResponse(200, 'comment unliked sucessfully'));
  }
});
export { toggleVideoLike, toggleCommentLike };
