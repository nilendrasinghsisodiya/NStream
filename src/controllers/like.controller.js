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
    const updatedVideo = await Video.aggregate([
      {
        $match: { _id: video._id },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "video",
          as: "likes",
        },
      },
      {
        $addFields: {
          likesCount: { $size: "$likes" },
        },
      },
      {
        $project: {
          _id: 1,
          likesCount: 1,
        },
      },
    ]);
    console.log(like);
    if (!like) {
      throw new ApiError(400, " Failed to like the video");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedVideo, "video like updated successfully")
      );
  } else {
    await Like.deleteOne({ _id: existingLike._id });
    const updatedVideo = await Video.aggregate([
      {
        $match: { _id: video._id },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "video",
          as: "likes",
        },
      },
      {
        $addFields: {
          likesCount: { $size: "$likes" },
        },
      },
      {
        $project: {
          _id: 1,
          likesCount: 1,
        },
      },
    ]);
    console.log(updatedVideo);
    return res
      .status(200)
      .json(new ApiResponse(200, updatedVideo, "video unliked successfully"));
  }
});

export { toggleVideoLike };
