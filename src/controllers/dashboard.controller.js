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
import { PresistView } from "../models/view.model.js";

const getChannelStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const totalSubscribers = await Subscription.countDocuments({
    channel: userId,
  });
  console.log("totalSubscribers");
  const totalViews = await PresistView.countDocuments({
    channelViewed: userId,
  });

  console.log("totalViews", totalViews);
  const mostPopularVideos = await Video.aggregate([
    { $match: { owner: new mongoose.Types.ObjectId(userId),deleted:false } },
    { $sort: { views: -1 } },
    { $limit: 5 },
    {$lookup:{
      from:"users",
      localField:"owner",
      foreignField:"_id",
      as:"ownerDetails",
      // pipeline:[{$project:{
      //   avatar:1,
      //   username:1,
      //   _id:1,
      //   subscribersCount:1
      // }}]
    }},
    {$unwind:{path:"$ownerDetails",preserveNullAndEmptyArrays:true}},

    {
      $project: {
        thumbnail: 1,
        views: 1,
        owner: {
          // avatar: req.user.avatar,
          // username: req.user.username,
          // subscribersCount: req.user.subscribersCount,
          // _id: req.user._id,
          avatar: "$ownerDetails.avatar",
          username: "$ownerDetails.username",
          subscribersCount: "$ownerDetails.subscribersCount",
          _id: "$ownerDetails._id",
        },
        title: 1,
        duration: 1,
        likesCount: 1,
      },
    },
  ]);
  console.log("most popularVideos", mostPopularVideos);
 
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;  
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const subsInLast7Days = await Subscription.countDocuments({
    channel: userId,
    createdAt: { $gte: sevenDaysAgo },
  });

  const subsInLast30Days = await Subscription.countDocuments({
    channel: userId,
    createdAt: { $gte: thirtyDaysAgo },
  });

  const viewsInLast7Days = await PresistView.countDocuments({channelViewed:userId,createdAt:{$gte:sevenDaysAgo}});
  const viewsInLast30Days = await PresistView.countDocuments({channelViewed: userId, createdAt:{$gte: thirtyDaysAgo}});
  const subsInLast24Hrs = await Subscription.countDocuments({channel:userId,createdAt:{$gte:dayAgo }});
  const viewsInLast24Hrs = await PresistView.countDocuments({channelViewed:userId,createdAt:{$gte: dayAgo}}); 
  // const userComments = await Comment.find({ owner: userId });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalSubscribers: totalSubscribers,
        totalViews,
        mostPopularVideos: mostPopularVideos,
        subsInLast30Days,
        subsInLast7Days,
        viewsInLast30Days,
        viewsInLast7Days,
        viewsInLast24Hrs,
        subsInLast24Hrs,
        // userComments,
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
  console.log(user)

  const sortOrder = sortType === "asc" ? 1 : -1;
 const aggregateQuery = Video.aggregate([
  { $match: { owner: user?._id ,deleted:false} },
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
    $project: {
      _id: 1,
      thumbnail: 1,
      createdAt: 1,
      title: 1,
      duration: 1,
      views: 1,
      likesCount: 1,
      tags:1,
      owner: {
        _id: "$ownerDetails._id",
        avatar: "$ownerDetails.avatar",
        username: "$ownerDetails.username",
        subscribersCount: "$ownerDetails.subscribersCount",
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
