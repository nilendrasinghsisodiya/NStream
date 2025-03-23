import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.body;
  // check if video with this id exist of not
  const video = await Video.findById(videoId);
  let message = ""

  if (!video) {
    throw new ApiError(400, "Invalid Video ID");
  }
  const userId = req?.user._id;
  const existingLike = await Like.findOne({
    likedby: userId,
    videoId: video._id,
  });

  if (!existingLike) {
    const like = await Like.create({
      likedBy: userId,
      video: video._id,
    });

    console.log(like);
    if (!like) {
      throw new ApiError(400, " Failed to like the video");
    }
    message= "video liked sucessfully"
  } else {
    await Like.deleteOne({ _id: existingLike._id });
    console.log(updatedVideo);
    message = "video disLiked sucessfully"
  }
 const likes = await Like.countDocuments({video:videoId});
  return res
    .status(200)
    .json(new ApiResponse(200, {likeCount:likes},message));
});
const toggleCommentLike = asyncHandler(async (req, res) => {
  const { targetId } = res.body;
  const userId = res?.user._id;
  let message = "";
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
      throw new ApiError(500, "failed to like ");
    }
    message = "comment liked sucessfully";
  } else {
    const unlike = await Like.findByIdAndDelete(liked._id);
    if (!unlike) {
      throw new ApiError(500, "falied to unlike");
    }
    message = "comment unliked sucessfully";
  }

  const likes = await Like.countDocuments({ comment: targetId });
  return res
    .status(200)
    .json(new ApiResponse(200, { LikeCount: likes }, message));
});
export { toggleVideoLike,toggleCommentLike };
