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
  const TagsArray = req.user.recentlyWatchedVideoTags;

  console.log("recentlyWatchVideoTags", TagsArray);

  const recommendedVideos = await Video.aggregate([
    {
      $match: {
        tags: { $in: TagsArray },
      },
    },
    {
      $lookup: {
        from: "Subscribers",
        localField: "owner",
        foreignField: "channel",
        as: "subscribers",
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
        matchCount: {
          $size: {
            $setIntersection: ["$tags", TagsArray],
          },
        },
        subscriberCount: {
          $size: "$subscribers",
        },
      },
    },
    { $sort: { matchCount: -1 } },
    {
      $project: {
        _id: 1,
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        views: 1,
        owner: {
          _id: "$ownerDetails._id",
          avatar: "$ownerDetails.avatar",
          username: "$ownerDetails.username",
          subscriberCount: "$subscriberCount"
        },
        
      },
    },
  ]);

  console.log("RecommendedVideos", recommendedVideos);
  return res
    .status(200)
    .json(new ApiResponse(200, recommendedVideos, "recommended videos"));
});

const getRelatedVideos = asyncHandler(async (req, res) => {
  const { videoId } = req.body;
  const { page = 1, limit = 10 } = req.query;
  const pageLimit = Number(limit);
  const pageNum = Number(page);
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "invalid object id");
  }
  const video = await Video.findById(videoId);

  const tags = Array.isArray(video.tags) ? video.tags : [];
  console.log(video);
  const aggregationQuery = Video.aggregate([
    {
      $match: {
        _id: { $ne: video._id }, // Exclude the current video
        tags: { $in: tags }, // Match videos that have tags in common
      },
    },
    {
      $addFields: {
        tagMatchCount: {
          $size: {
            $filter: {
              input: "$tags", // This is the tags in the document
              as: "tag",
              cond: { $in: ["$$tag", tags] }, // This should match tags passed into the aggregation
            },
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        thumbnail: 1,
        createdAt: 1,
        views: 1,
        tagMatchCount: 1, // Include the tag match count for sorting purposes
      },
    },
  ]);

  const options = {
    page: pageNum,
    limit: pageLimit,
    customLabels: {
      docs: "relatedVideos",
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
  return res
    .status(200)
    .json(
      new ApiResponse(200, relatedVideos, "related vidoes fetched successfully")
    );
});

const getPopularVideos = asyncHandler(async (req, res) => {
  const rand = Math.floor(Math.random() * 10);
  const {limit,page} = req.query;
  const popularVideosQuery =  Video.aggregate([
    { $sort: { views: -1 } }, // Sort by most viewed videos // Get top 10 videos
    {
      $lookup: {
        from: "subscriptions", // Join with the subscriptions collection
        localField: "owner",
        foreignField: "channel",
        as: "subscribers",
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
        subscriberCount: { $size: "$subscribers" }, // Correctly count subscribers
      },
    },
    {
      $project: {
        _id: 1,
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        views: 1,
        owner: {
          _id: "$ownerDetails._id",
          avatar: "$ownerDetails.avatar",
          username: "$ownerDetails.username",
          subscriberCount:"$subscriberCount"
        },
      },
    },
  ]);
  const options = {
    limit:Number(limit),
    page:Number(page),
    customLabels:{
      totalDocs:"totalVideos",
      page:"currentPage",
      docs:"popularVideos",

    }
  }
  const popularVideos= await Video.aggregatePaginate(popularVideosQuery,options);
  console.log(popularVideos);
  if (popularVideos.totalDocs ===0) {
    throw new ApiError(500, "no popular video found");
  }
  console.log(popularVideos);
  return res
    .status(200)
    .json(
      new ApiResponse(200, popularVideos, "popular videos fetched successfully")
    );
});

const getSubscribedVideos = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const { limit = 10, page = 1 } = req.query;
  const pageNum = Number(page);
  const limitTo = Number(limit);
  if (!userId) {
    throw new ApiError(400, "no userId for subscribed video");
  }
  const videosQuery = User.aggregate([
    { $match: { _id: userId } },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    { $unwind: "$subscribedTo" },
    {
      $lookup: {
        from: "videos",
        localField: "$subscribedTo._id",
        foreignField: "owner",
        as: "subscribedToVideos",
      },
    },
    { $unwind: "$subscribedTovideos" },
    {$lookup:{
      from:"User",
      localField:"$subscribedToVideo.owner",
      foreignField:"owner",
      as:"subscribedToVideosOwner"
    }},
    {$unwind:"$subscribedToVideosOwner"},

    {
      $project: {
        _id: 1,
        videos: {
          _id: "$subscribedToVideos._id",
          videoFile: "$subscribedToVideos.videoFile",
          thumbnail: "$subscribedToVideos.videoFIle",
          title:"$subscribedToVideos.title",
          owner:{
              _id:"$subscribedToVideosOwner._id",
              username:"$subscribedToVideosOwner.username",
              avatar:"$subscribedToVideosOwner.avatar"
          }
        },
      },
    },
    { $sort: { "$subscribedToVideos.createdAt": 1 } },
  ]);
  const options={
    limit:limitTo,
    page:pageNum,
    customLabels:{
      page:'currentPage',
      totalDocs:"totalVidoes",
      docs:"recommendedVideos"
    }
  }
  
const videos = await Video.aggregatePaginate(videosQuery,options);
  console.log("videos",videos);
  if(videos.length === 0 ){
    throw new ApiError(500,"no subscribed to videos");
  }

  
});

export { getUserRecommendation, getRelatedVideos, getPopularVideos,getSubscribedVideos };
