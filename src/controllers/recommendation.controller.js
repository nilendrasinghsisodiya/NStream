import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
/**
 *
 */
const getUserRecommendation = asyncHandler(async (req, res) => {
  if (!req.user) {
    res
      .status(200)
      .json(
        new ApiResponse(200, [], "optional request: user not found forwarding")
      );
  }
  const TagsArray = req.user.recentlyWatchedVideoTags;

  console.log("recentlyWatchVideoTags", TagsArray);

  const recommendedVideos = await Video.aggregate([
    {
      $match: {
        tags: { $in: TagsArray },
        deleted: false,
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
        matchCount: {
          $size: {
            $setIntersection: ["$tags", TagsArray],
          },
        },
      },
    },
    { $sort: { matchCount: -1 } },
    {
      $project: {
        _id: 1,
        videoFile: 1,
        thumbnail: 1,
        duration: 1,
        title: 1,
        views: 1,
        likesCount: 1,
        owner: {
          _id: "$owner._id",
          avatar: "$owner.avatar",
          username: "$owner.username",
          subscribersCount: "$owner.subscribersCount",
        },
      },
    },
  ]);

  console.log("RecommendedVideos", recommendedVideos);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { ...recommendedVideos, optional: true },
        "recommended videos"
      )
    );
});

const getRelatedVideos = asyncHandler(async (req, res) => {
  const { videoId } = req.query;
  const { page = 1, limit = 10 } = req.query;
  const pageLimit = Number(limit);
  const pageNum = Number(page);
  console.log("videoId in realtedVideos ", videoId);
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "invalid object id");
  }
  const video = await Video.findById(videoId);

  const tags = Array.isArray(video.tags) ? video.tags : [];
  console.log(tags);
  console.log("videoTag in relatedVideo", tags);

  console.log("video in related  video", video);
  const aggregationQuery = Video.aggregate([
    {
      $match: {
        _id: { $ne: video._id },
        deleted: false, // Exclude the current video
        tags: { $in: ["test"] }, // Match videos that have tags in common
      },
    },
    {
      $lookup: {
        from: "users",
        foreignField: "_id",
        localField: "owner",
        as: "ownerDetails",
      },
    },
    { $unwind: { path: "$ownerDetails", preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        tagMatchCount: {
          $size: { $setIntersection: ["$tags", tags] },
        },
      },
    },
    {
      $project: {
        _id: 1,
        thumbnail: 1,
        likesCount: 1,
        createdAt: 1,
        duration: 1,
        title: 1,
        views: 1,
        tagMatchCount: 1,
        owner: {
          avatar: "$ownerDetails.avatar",
          _id: "$ownerDetails._id",
          username: "$ownerDetails.username",
          subscribersCount: "$ownerDetails.subscribersCount",
        }, // Include the tag match count for sorting purposes
      },
    },
  ]);

  const options = {
    page: pageNum,
    limit: pageLimit,
    customLabels: {
      docs: "Videos",
      totalDocs: "totalVideos",
      page: "currentPage",
    },
  };
  const relatedVideos = await Video.aggregatePaginate(
    aggregationQuery,
    options
  );
  if (!relatedVideos) {
    throw new ApiError(500, "failed to fetch related videos");
  }
  console.log("related videos", relatedVideos);
  return res
    .status(200)
    .json(
      new ApiResponse(200, relatedVideos, "related vidoes fetched successfully")
    );
});

const getPopularVideos = asyncHandler(async (req, res) => {
  const { limit, page } = req.query;
  const popularVideosQuery = Video.aggregate([
    {
      $match: {
        deleted: false,
      },
    },
    { $sort: { views: -1 } },

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
    },
  ]);
  const options = {
    limit: Number(limit),
    page: Number(page),
    customLabels: {
      totalDocs: "totalVideos",
      page: "currentPage",
      docs: "Videos",
    },
  };
  const popularVideos = await Video.aggregatePaginate(
    popularVideosQuery,
    options
  );
  console.log(popularVideos);

  console.log(popularVideos);
  return res
    .status(200)
    .json(
      new ApiResponse(200, popularVideos, "popular videos fetched successfully")
    );
});

const getSubscribedVideos = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { limit = 10, page = 1 } = req.query;
  const pageNum = Number(page);
  const limitTo = Number(limit);
  if (!userId) {
    throw new ApiError(400, "no userId for subscribed video");
  }
  const videosQuery = User.aggregate([
  {
    $match: {
      _id: new mongoose.Types.ObjectId(userId),
    },
  },
  {
    $lookup: {
      from: "subscriptions",
      localField: "_id",
      foreignField: "subscriber",
      as: "subscribedTo",
    },
  },
  {
    $unwind: {
      path: "$subscribedTo",
      preserveNullAndEmptyArrays: false, // false if you only want subscribed users
    },
  },
  {
    $lookup: {
      from: "videos",
      let: { channelId: "$subscribedTo.channel" }, 
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ["$owner", "$$channelId"], 
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "videoOwner",
          },
        },
        {
          $unwind: "$videoOwner",
        },
        {
          $project: {
            _id: 1,
            thumbnail: 1,
            title: 1,
            tags: 1,
            views: 1,
            duration: 1,
            createdAt: 1,
            owner: {
              _id: "$videoOwner._id",
              username: "$videoOwner.username",
              avatar: "$videoOwner.avatar",
              subscribersCount:"$videoOwner.subscribersCount"
            },
          },
        },
      ],
      as: "subscribedToVideos",
    },
  },
  {
    $project: {
      _id: 0,
      subscribedToVideos: 1,
    },
  },
  {
    $unwind: "$subscribedToVideos",
  },
  {
    $replaceRoot: { newRoot: "$subscribedToVideos" },
  },
]);

  const options = {
    limit: limitTo,
    page: pageNum,
    customLabels: {
      page: "currentPage",
      totalDocs: "totalVidoes",
      docs: "Videos",
    },
  };

  const videos = await User.aggregatePaginate(videosQuery, options);
  console.log("videos", videos);
  if (videos.length === 0) {
    throw new ApiError(404, "no subscribed to videos");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, videos, "subscribed videos fetched sucessfully")
    );
});

export {
  getUserRecommendation,
  getRelatedVideos,
  getPopularVideos,
  getSubscribedVideos,
};
