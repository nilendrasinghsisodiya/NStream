import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const {page=1,limit=10, sortBy="createdAt", sortType='asc'} = req?.query;
  const {user} = req?.user;
 const pageNum =Number(page);
 const pageLimit = Number(limit)
const skip = (pageNum-1) * pageLimit;
const sortOrder = sortType === "asc" ? 1 : -1;
const aggregateQuery = [
  {$match:{owner: user?._id}},
  {$project:{
    _id:1,
    thumbnail:1,
    videoFile:1,
    title:1,
    views:1
    

  }},
  {$sort:{[sortBy]:sortOrder}},
  {$skip:skip},
  {$limit:pageLimit}
];
const options = {
  page: pageNum,
  limit: pageLimit,
  customLabels: {
    docs: "videos",
    totalDocs: "total videos",
    totalPages: "total pages",
    page: "current page",
  },
};

const videos = await Video.aggregatePaginate(aggregateQuery,options);
if(!videos){
 throw new ApiError(400,"Failed to fetch channel videos")
}
return res.status(200).json(new ApiResponse(200,videos,"channel videos fetched successfully"));


});

export { getChannelStats, getChannelVideos };
