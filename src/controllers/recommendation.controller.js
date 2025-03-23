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
        videoFilePublicId: 0,
        thumbnailPublicId: 0,
        tags: 0,
        owner: {
          refreshToken: 0,
          password: 0,
          avatarPublicId: 0,
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

  // can be done with video.find but is less fesiable and can be more customized
  // can add a title matching system but would need to design it first
  //possible steps
  // 1. split the title by space
  // 2. to be implemented {remove comman words such what to  and who , others
  // 3. maybe a llm can be used
  // 4. match by those remaining words using regex
  // 5. should be case insesitive}
  // 6. after that we should do tag based matching which is straight forward and assign weights to videos with more tags matched

  const tags = Array.isArray(video.tags) ? video.tags : [];
  console.log(video);
  const aggregationQuerry = [
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
    { $skip: (pageNum - 1) * pageLimit },
    { $limit: pageLimit },
  ];

  const options = {
    page: pageNum,
    limit: pageLimit,
    customLabels: {
      docs: "related videos",
      totalDocs: "total related videos",
      totalPages: "total pages",
      page: "current page",
    },
  };
  const relatedVideos = await Video.aggregatePaginate(
    aggregationQuerry,
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
  const popularVideos = await Video.aggregate([
    { $sort: { views: -1 } }, // Sort by most viewed videos
    { $limit: 10 }, // Get top 10 videos
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
        },
        subscriberCount: 1,
      },
    },
  ]);
  console.log(popularVideos)
  if (!Array.isArray(popularVideos) || popularVideos.length === 0) {
    throw new ApiError(500, "no popular video found");
  }
  console.log(popularVideos);
  return res
    .status(200)
    .json(
      new ApiResponse(200, popularVideos, "popular videos fetched successfully")
    );
});

export { getUserRecommendation, getRelatedVideos, getPopularVideos };
