import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { populate } from "dotenv";
import { Comment } from "../models/comment.model.js";

const getChannelStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const totalSubscribers = await Subscription.find({ channel: userId });
  console.log("totalSubscribers");
  const totalViews = await Video.aggregate([
    { $match: { owner: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: null, totalViews: { $sum: "$views" } } },
  ]);
  console.log("totalViews", totalViews);
  const mostPopularVideos = await Video.aggregate([
    { $match: { owner: new mongoose.Types.ObjectId(userId) } },
    { $sort: { views: 1 } },
    { $limit: 10 },
    {
      $project: {
        thumbnail: 1,
        views: 1,
        owner: {
          avatar: 1,
          username: 1,
          subscribersCount: 1,
          _id: 1,
        },
        title: 1,
        duration: 1,
        likesCount: 1,
      },
    },
  ]);
  console.log("most popularVideos", mostPopularVideos);
  const likedVideos = await Video.aggregate([
    {
      $lookup: {
        foreignField: "Video",
        from: "Like",
        localField: "_id",
        as: "likedVideos",
      },
    },
    { $unwind: { path: "$likedVideos", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        thumbnail: 1,
        title: 1,
        views: 1,
        owner: 1,
      },
    },
  ]);
  console.log("likedVideos", likedVideos);

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const subsInLast7Days = (
    await Subscription.find({
      channel: userId,
      createdAt: { $gte: sevenDaysAgo },
    })
  ).length;
  const subsInLast30Days = (
    await Subscription.find({
      channel: userId,
      createdAt: { $gte: thirtyDaysAgo },
    })
  ).length;
  const userComments = await Comment.find({ owner: userId });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalSubscribers: totalSubscribers.length,
        totalViews: totalViews[0].totalViews,
        mostPopularVideos: mostPopularVideos[0],
        likedVideos: likedVideos[0],
        subsInLast30Days,
        subsInLast7Days,
        userComments,
      },
      "stats fetched successfully"
    )
  );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortType = "asc",
    username,
  } = req?.query;

  const pageNum = Number(page);
  const pageLimit = Number(limit);
  const user = await User.findOne({ username });

  const sortOrder = sortType === "asc" ? 1 : -1;
  const aggregateQuery = Video.aggregate([
    { $match: { owner: user?._id } },
    {
      $project: {
        _id: 1,
        thumbnail: 1,
        createdAt: 1,
        title: 1,
        duration: 1,
        views: 1,
        likesCount: 1,
        owner: {
          _id: user?._id,
          avatar: user?.avatar,
          username: user?.username,
        },
      },
    },
    { $sort: { [sortBy]: sortOrder } },
  ]);
  const options = {
    page: pageNum,
    limit: pageLimit,
    customLabels: {
      docs: "Videos",
      totalDocs: "total videos",
      totalPages: "total pages",
      page: "current page",
    },
  };

  const videos = await Video.aggregatePaginate(aggregateQuery, options);
  if (!videos) {
    throw new ApiError(400, "Failed to fetch channel videos");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, videos, "channel videos fetched successfully"));
});

export { getChannelStats, getChannelVideos };
