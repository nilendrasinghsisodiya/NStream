import mongoose, { isValidObjectId, Mongoose } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Like } from "../models/like.model.js";
import { View, PresistView } from "../models/view.model.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { Subscription } from "../models/subscription.model.js";
import { escapeRegex } from "../utils/additionalUtils.js";

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
      filter.title = { $regex: escapeRegex(query), $options: "i" };
    }

    const pageNum = parseInt(page);
    const pageLimit = parseInt(limit);

    let sortOrder;
    if (sortType) {
      sortOrder = sortType === "asc" ? 1 : -1;
    }
    const sortObj = sortBy ? { [sortBy]: sortOrder } : {}; // Default to no sorting

   

    const aggregateQuery = Video.aggregate([
      { $match: { ...filter, deleted: false } }, // Apply the filter
      { $sort: sortObj },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
        },
      },
      { $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          duration: 1,
          thumbnail: 1,
          title: 1,
          views: 1,
          owner: {
            _id: "$owner._id",
            avatar: "$owner.avatar",
            username: "$owner.username",
            subscribersCount: "$owner.subscribersCount",
          },
        },
      }, // Apply sorting
      // Pagination: Limit based on page size
    ]);

    // Pagination options
    const options = {
      page: pageNum,
      limit: pageLimit,
      customLabels: {
        docs: "Videos",
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
    const { title, tags } = req.body;

    // step 1 : check if user is logged in
    // step 2: check if video thumbnail description and title is provided
    // step 3: upload video and thumanail to cloudinary
    // setp 4: check if upload is successfull
    // step 5: create a new videoDoc
    // step 6: return res with video obj
    const userId = req?.user?._id;
    if (!userId) {
      throw new ApiError(401, "Unauthorized Access");
    }

    if (!title) {
      throw new ApiError(400, "video title is required");
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
    const videoUrl = await uploadOnCloudinary(
      videoLocalpath,
      `${userId}'s_vid`
    );
    if (!videoUrl) {
      throw new ApiError(
        500,
        "something went wrong while uploading video to cloundinary"
      );
    }

    const thumbnailUrl = await uploadOnCloudinary(
      videoThumbnailLocalPath,
      `${userId}'s_vid`
    );
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
      // description,
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

    throw new ApiError(500, error.message);
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.query;
  const userId = req?.user?._id;
  const ip =
    req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  console.log(videoId);
  const isValidId = isValidObjectId(videoId);
  if (!isValidId) {
    throw new ApiError(400, "Invalid videoId");
  }

  const hasViewed = await View.findOne({
    ip,
    video: videoId,
  });

  if (!hasViewed) {
    await View.create({
      ip,
      user: userId || null,
      video: videoId,
      // expiresAt is auto-set in model to 24h
    });

    const viewed = await Video.findByIdAndUpdate(videoId, {
      $inc: { views: 1 },
    });
    await PresistView.create({
      video: videoId,
      viewedBy: userId,
      channelViewed: viewed.owner,
    }); // these are repeated, like but only once 24 hours
  }

  // 👇 Aggregate video details
  const video = await Video.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(videoId), deleted: false } },
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
        as: "owner",
      },
    },
    { $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
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
      $project: {
        _id: 1,
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        views: 1,
        // description: 1,
        duration: 1,
        likesCount: 1,
        tags: 1,
        owner: {
          _id: 1,
          avatar: 1,
          username: 1,
          subscribersCount: 1,
        },
      },
    },
  ]);

  if (!video || !video[0]) {
    throw new ApiError(400, "Invalid videoId or the video does not exist");
  }

  // 👇 Update user's watch history if logged in
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

    if (!result) {
      throw new ApiError(500, "Failed to add video to watch history");
    }
  }

  // 👇 Check subscription and like status
  const [isSubscribed, isLiked] = await Promise.all([
    Subscription.findOne({ subscriber: userId, channel: video[0].owner._id }),
    Like.findOne({ likedBy: userId, video: videoId }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...video[0],
        isSubscribed: !!isSubscribed,
        isLiked: !!isLiked,
      },
      "Video fetched successfully"
    )
  );
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId, tags,title } = req.body;
  const userId = req.user?._id;
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "Video not found");
  }
  const isOwner = video.isOwner(req?.user?._id);
  if (!isOwner) {
    throw new ApiError(400, "you have to be owner to update the video details");
  }
  console.log("req.body : ", req.body);
  console.log("req.file", req.file);
  const thumbnailLocalPath = req?.file?.path; 
  let updatedThumbnailLink = null;

  if (thumbnailLocalPath) {
    updatedThumbnailLink = await uploadOnCloudinary(
      thumbnailLocalPath,
      `${userId}'s_vid`
    );
    console.log(updatedThumbnailLink);
    if (!updatedThumbnailLink) {
      throw new ApiError(500, "Failed to upload new thumbnail to Cloudinary");
    }
  }
  const oldPublicId = video.thumbnailPublicId;

  const updateData = {};
  if (title) updateData.title = title;
  if (updatedThumbnailLink) {
    updateData.thumbnail = updatedThumbnailLink?.url;
    updateData.thumbnailPublicId = updatedThumbnailLink?.public_id;
  }
  if(tags){
    updateData.tags = tags;
  }

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, "No details provided for update");
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    { $set: updateData, },
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
  const { videoId } = req.query;
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "video does not exist");
  }
  const isOwner = video.isOwner(req?.user?._id);
  if (!isOwner) {
    throw new ApiError(403, "You have to be owner to delete a video");
  }
  const videoPublicId = video.videoFilePublicId; // public id of the video
  const thumbnailPublicId = video.thumbnailPublicId; // public id of the thumbnail

  //deletes the video from database
  const deletedVid = await Video.findByIdAndUpdate(videoId, {
    $set: {
      deleted: true,
    },
  });
  console.log("isDeleted", deletedVid.deleted);

  try {
    deleteFromCloudinary(videoPublicId).then((res) => {
      console.log("cloudinary video deleted result ", res);
      deleteFromCloudinary(thumbnailPublicId)
        .then((res) => {
          console.log(" res for thumbnail deletion", res);
        })
        .catch((e) => {
          console.log("thumbnailError", e);
        })
        .catch((e) => {
          console.log("videoError", e);
        });
    });
  } catch (error) {
    console.warn(
      "failed to deleted video or thumbnail form cloudinary ",
      error
    );
  }
  // deletes the actuall resource form cloud

  return res.status(200).json(
    new ApiResponse(
      200,
      
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
      403,
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

const likedVideo = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const likedVideos = await Like.aggregate([
    {
      $match: { likedBy: userId },
    },
    {
      $limit: 30,
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "likedVideos",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "vidOwner",
            },
          },
          {
            $unwind: {
              path: "$vidOwner",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              thumbnail: 1,
              title: 1,
              views: 1,
              duration: 1,
              owner: {
                avatar: "$vidOwner.avatar",
                _id: "$vidOwner._id",
                username: "$vidOwner.username",
                subscribersCount: "$vidOwner.subscribersCount",
              },
            },
          },
        ],
      },
    },
    { $unwind: { path: "$likedVideos", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        likedVideos: 1,
      },
    },
  ]);
  const LikedVideos = likedVideos.map((lv) => lv.likedVideos);

  return res
    .status(200)
    .json(
      new ApiResponse(200, LikedVideos, "liked videos feteched sucessfully")
    );
});

export {
  likedVideo,
  searchVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
