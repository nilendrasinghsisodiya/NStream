import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

const searchVideos = asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      query,
      sortBy = "createdAt",
      sortType = "asc",
    } = req.query;

    const filter = {};
    if (query) {
      filter.title = { $regex: query, $options: "i" };
    }

    const pageNum = parseInt(page);
    const pageLimit = parseInt(limit);

    let sortOrder;
    if (sortType) {
      sortOrder = sortType === "asc" ? 1 : -1;
    }
    const sortObj = sortBy ? { [sortBy]: sortOrder } : {}; // Default to no sorting

    const aggregateQuery = Video.aggregate([
      { $match: filter }, // Apply the filter
      { $sort: sortObj }, // Apply sorting
       // Pagination: Limit based on page size
    ]);

    // Pagination options
    const options = {
      page: pageNum,
      limit: pageLimit,
      customLabels: {
        docs: "videos",
        totalDocs: "totalVideos",
        totalPages: "totalPages",
        page: "currentPage",
      },
    };

    // Apply pagination
    const result = await Video.aggregatePaginate(aggregateQuery, options);
    if (!result) {
      throw new ApiError(500, "Failed to fetch videos");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Videos fetched successfully"));
  } catch (err) {
    throw new ApiError(500, err.message);
  }
});

const publishAVideo = asyncHandler(async (req, res) => {
  try {
    const { title, description, tags } = req.body;

    // step 1 : check if user is logged in
    // step 2: check if video thumbnail description and title is provided
    // step 3: upload video and thumanail to cloudinary
    // setp 4: check if upload is successfull
    // step 5: create a new videoDoc
    // step 6: return res with video obj
    const userId = req?.user;
    if (!userId) {
      throw new ApiError(401, "Unauthorized Access");
    }

    if (!title || !description) {
      throw new ApiError(400, "video title and description is required");
    }
    console.log("req.files : ", req.files);
    const videoLocalpath = req.files?.videoFile[0]?.path;
    console.log("Video loacalPath : ", videoLocalpath);

    const videoThumbnailLocalPath = req?.files?.thumbnail[0]?.path;
    console.log("Thumbnail localPath : ", videoThumbnailLocalPath);

    if (!videoLocalpath) {
      throw new ApiError(
        500,
        "no video found or something went wrong while uploading the file"
      );
    }
    if (!videoThumbnailLocalPath) {
      throw new ApiError(400, "no thumbnail provided");
    }
    const videoUrl = await uploadOnCloudinary(videoLocalpath);
    if (!videoUrl) {
      throw new ApiError(
        500,
        "something went wrong while uploading video to cloundinary"
      );
    }

    const thumbnailUrl = await uploadOnCloudinary(videoThumbnailLocalPath);
    if (!thumbnailUrl) {
      throw new ApiError(
        500,
        "something went wrong while uploading thumbnail to cloudinary"
      );
    }
    console.log("videoUrl obj : ", videoUrl);
    const video = await Video.create({
      videoFile: videoUrl?.url,
      title: title,
      thumbnail: thumbnailUrl?.url,
      description,
      owner: userId,
      duration: videoUrl.duration,
      thumbnailPublicId: thumbnailUrl.public_id,
      videoFilePublicId: videoUrl.public_id,
      tags: tags ? tags : [],
    });

    if (!video) {
      throw new ApiError(500, "something went wrong while creating video doc");
    }

    console.log("video doc : ", video);

    return res
      .status(200)
      .json(new ApiResponse(200, video, "videoUploaderSuccessfully"));
  } catch (error) {
    console.log(error);

    throw new ApiError(200, error.message);
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.query;
  console.log("qparams",req.query);
  console.log("videoId", videoId);
  const userId = req?.user?._id;

  const isValidId = isValidObjectId(videoId);
  if (!isValidId) {
    throw new ApiError(400, "invalid videoId");
  }
  await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });
  const video = await Video.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(videoId) } },
    {
      $lookup: {
        from: "subscriptions",
        localField: "owner",
        foreignField: "channel",
        as: "subscribers",
      },
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
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
      },
    },
    { $unwind: "$ownerDetails" },
    {
      $addFields: {
        subscriberCount: { $size: "$subscribers" },
        likeCount: { $size: "$likes" },
        ownerDetails: "$ownerDetails",
        isLiked: userId
          ? {
              $gt: [
                {
                  $size: {
                    $filter: {
                      input: "$likes",
                      as: "like",
                      cond: { $eq: ["$$like.likedBy", userId] },
                    },
                  },
                },
                0,
              ],
            }
          : false,
      },
    },

    {
      $set: { views: { $add: ["$views", 1] } }, // Increment "views" field by 1
    },
    {
      $project: {
        _id: 1,
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        views: 1,
        description: 1,
        likeCount: 1,
        subscriberCount: 1,
        tags: 1,
        ownerDetails: {
          _id: 1,
          avatar: 1,
          username: 1,
        },
      },
    },
  ]);
  console.log("req.body : ", req?.body);

  console.log(Array.isArray(video));
  console.log("video", video[0]);

  if (userId) {
    const result = await User.findByIdAndUpdate(
      { _id: userId },
      {
        $addToSet: {
          watchHistory: videoId,
          recentlyWatchedVideoTags: { $each: video[0].tags },
        },
      }
    );
    console.log(result);
    if (!result) {
      throw new ApiError(500, "failed to add video to the user watch history");
    }
  }
  if (!video) {
    throw new ApiError(400, "Invalid videoId or the video does not exist");
  }
  console.log(video[0]);

  return res
    .status(200)
    .json(new ApiResponse(200, video[0], "Video Fetched successfully "));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.body;
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "Video not found");
  }
  const isOwner = video.isOwner(req?.user?._id);
  if (!isOwner) {
    throw new ApiError(400, "you have to be owner to update the video details");
  }
  const { title, description } = req.body;
  console.log("req.body : ", req.body);
  console.log("req.file", req.file);
  const thumbnailLocalPath = req?.file?.path; // Adjust to match file upload structure
  let updatedThumbnailLink = null;

  if (thumbnailLocalPath) {
    updatedThumbnailLink = await uploadOnCloudinary(thumbnailLocalPath);
    console.log(updatedThumbnailLink);
    if (!updatedThumbnailLink) {
      throw new ApiError(500, "Failed to upload new thumbnail to Cloudinary");
    }
  }
  const oldPublicId = video.thumbnailPublicId;

  const updateData = {};
  if (title) updateData.title = title;
  if (description) updateData.description = description;
  if (updatedThumbnailLink) {
    updateData.thumbnail = updatedThumbnailLink?.url;
    updateData.thumbnailPublicId = updatedThumbnailLink?.public_id;
  }

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, "No details provided for update");
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    { $set: updateData },
    { new: true }
  );
  if (!updatedVideo) {
    throw new ApiError(404, "Video not found");
  }
  if (updatedThumbnailLink) {
    const deletedResult = await deleteFromCloudinary(oldPublicId);
    console.log("deleted old thumbnail : ", deletedResult);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.body;
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "video does not exist");
  }
  const isOwner = video.isOwner(req?.user?._id);
  if (!isOwner) {
    throw new ApiError(400, "You have to be owner to delete a video");
  }
  const videoPublicId = video.videoFilePublicId; // public id of the video
  const thumbnailPublicId = video.thumbnailPublicId; // public id of the thumbnail

  //deletes the video from database
  const deletedRes = await Video.findByIdAndDelete(videoId);
  console.log("deleted video result form db : ", deletedRes);

  // deletes the actuall resource form cloud
  const videoDeletedResult = await deleteFromCloudinary(videoPublicId);
  const thumbnailDeletedResult = await deleteFromCloudinary(thumbnailPublicId);
  console.log("video dleted from cloudinary : ", videoDeletedResult);
  console.log("thumbnail deleted form cloudinary : ", thumbnailDeletedResult);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        deleteResult: {
          thumbnail: thumbnailDeletedResult,
          video: videoDeletedResult,
        },
      },
      "video deleted successfully"
    )
  );
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.body;
  const video = await Video.findById(videoId);
  console.log(video);
  const isOwner = video.isOwner(req?.user?._id);

  if (!isOwner) {
    throw new ApiError(
      400,
      "You have to be logged In and be the Owner of the Video to change publish settings"
    );
  }
  const updatedVideo = await Video.findOneAndUpdate(
    { _id: videoId },
    {
      $set: {
        isPublished: !video.isPublished,
      },
    },
    { new: true }
  );
  if (!updatedVideo) {
    throw new ApiError(400, "video not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedVideo, "publish status updated successfully")
    );
});

export {
  searchVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
