import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose, { isValidObjectId } from "mongoose";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.body;
  // check if video with this id exist of not
  console.log("in like controller","videoId",videoId);
  let message = "";

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video id");
  }
  const userId = req?.user?._id;
  console.log("userId", userId, "videoId:", videoId);
  const existingLike = await Like.findOne({
    likedBy: userId,
    video: new mongoose.Types.ObjectId(videoId),
  });
  console.log("existingLike", existingLike);

  if (!existingLike) {
    const like = await Like.create({
      likedBy: userId,
      video: new mongoose.Types.ObjectId(videoId),
    });
    Video.findByIdAndUpdate(
      { _id: new mongoose.Types.ObjectId(videoId) },
      { $inc: { likesCount: 1 } }
    )
      .then(() => console.log("video like count updated successfully"))
      .catch((error) => console.log(error.message));
    console.log(like);
    if (!like) {
      throw new ApiError(400, " Failed to like the video");
    }
    message = "video liked sucessfully";
  } else {
    await Like.deleteOne({ _id: existingLike._id });
    Video.findByIdAndUpdate(
      { _id: new mongoose.Types.ObjectId(videoId) },
      { $inc: { likesCount: -1 } }
    )
      .then(() => console.log("video like count updated successfully"))
      .catch((error) => console.log(error.message));
    message = "video disLiked sucessfully";
  }
  return res.status(200).json(new ApiResponse(200, {}, message));
});
const toggleCommentLike = asyncHandler(async (req, res) => {
  const { targetId } = req.body;
  console.log("targetId:", targetId);
  const userId = req?.user?._id;
  console.log("userId", userId);

  if (!targetId) {
    throw new ApiError("invalid or empty targetId");
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
      throw new ApiError(500, "failed to like the comment");
    }
    console.log("liked");
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "comment liked sucessfully"));
  } else {
    const like = await Like.deleteOne({ likedBy: userId });
    if (!like) {
      throw new ApiError(500, "failed to unlike comment");
    }

    console.log("unliked (like deleted)");
    return res
      .status(200)
      .json(new ApiResponse(200, "comment unliked sucessfully"));
  }
});
export { toggleVideoLike, toggleCommentLike };
