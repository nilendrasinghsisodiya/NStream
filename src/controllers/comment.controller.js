import mongoose, { isValidObjectId ,Types} from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.body;
  const userId = req?.user._id;
  console.log(videoId);
  const {
    page = 1,
    limit = 10,
    sortBy = "created_at",
    sortType = "asc",
  } = req.query;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "invalid videoId");
  }
  const pageNum = Number(page);
  const pageLimit = Number(limit);
  const sortOrder = sortType === "asc" ? 1 : -1;
  const aggregateQuery = [
    { $match: { video: new Types.ObjectId(videoId) } },
    {$lookup:{
      from:"likes",
      localField:"owner",
      foreignField:"likedBy",
      as:"likes"
    }},
   { $addFields: {
      likeCount: { $size: "$likes" },  // Count total likes
      isLiked: userId
        ? { 
            $gt: [
              { $size: { $filter: { input: "$likes", as: "like", cond: { $eq: ["$$like.likedBy", userId] } } } },
              0
            ]
          }
        : false
    }},
    {$project: {
      _id:1,
      content:1,
      createdAt:1,
      owner:1,
      likesCount:1,
      isLiked:1
      }},
    { $sort: { [sortBy]: sortOrder } },
    { $skip: (pageNum - 1) * pageLimit },
    { $limit: pageLimit },
    
  ];
  const options = {
    page: pageNum,
    limit: pageLimit,
    customLabels: {
      docs: "comments",
      totalDocs: "total comments",
      totalPages: "total pages",
      page: "current page",
    },
  };
  const comments = await Comment.aggregatePaginate(aggregateQuery, options);
  if (!comments) {
    throw new ApiError(404, "failed to find comments or no comments found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "commnets fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video

  const { videoId, content } = req.body;
  const userId = req?.user._id;
  if (!userId) {
    throw new ApiError(401, "Unauthorzied access");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "not a Valid video Id");
  }
  if (!content) {
    throw new ApiError(400, "Empty or invalid content");
  }

  const comment = await Comment.create({
    content: content,
    video: videoId,
    owner: userId,
  });
  if (!comment) {
    throw new ApiError(500, "Failed to create a comment");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment created successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId, videoId, content } = req.body;
  const userId = req?.user._id;
  if (!commentId || !videoId || !content) {
    throw new ApiError(400, "empty cotent , commentId or videoId");
  }
  
  if (!userId) {
    throw new ApiError(401, "Unauthroized access");
  }
  if (!isValidObjectId(commentId || !isValidObjectId(videoId))) {
    throw new ApiError(400, "invalid  comment or  video Id");
  }
  const isOwner = await Comment.findById(commentId).isOwner(userId);
  if(!isOwner){
    throw new ApiError(403,"unauthroized request");
  }
  const updatedComment = await Comment.findByIdAndUpdate(
    { _id: commentId },
    { $set: { content: content } },
    { new: true }
  );
  if (!updatedComment) {
    throw new ApiError(500, "failed to update comment");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.body;
  const userId = req?.user?._id;
  if (!isValidObjectId(commentId) || !userId) {
    throw new ApiError(400, "Invalid comment id or unauthrized acceess");
  }
  const comment = await Comment.findById(commentId);
  const isOwner = comment.isOwner(userId);
  if (!isOwner) {
    throw new ApiError(400, "NOT THE OWNER");
  }
  const deleteRes = await Comment.findByIdAndDelete(commentId);
  if (!deleteRes) {
    throw new ApiError(500, "failed to delete comment");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, deleteRes, "comment deleted successfully"));
});

const getReplies = asyncHandler(async(req,res)=>{
  const { commentId } = req.body;
  const userId = req?.user._id;
  console.log(commentId);
  const {
    page = 1,
    limit = 10,
  } = req.query;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "invalid videoId");
  }
  const pageNum = Number(page);
  const pageLimit = Number(limit);
 
  const aggregateQuery = [
    { $match: { comment: new Types.ObjectId(commentId) } },
    {$lookup:{
      from:"likes",
      localField:"owner",
      foreignField:"likedBy",
      as:"likes"
    }},
   { $addFields: {
      likeCount: { $size: "$likes" },  // Count total likes
      isLiked: userId
        ? { 
            $gt: [
              { $size: { $filter: { input: "$likes", as: "like", cond: { $eq: ["$$like.likedBy", userId] } } } },
              0
            ]
          }
        : false
    }},
    {$project: {
      _id:1,
      content:1,
      createdAt:1,
      owner:1,
      likesCount:1,
      isLiked:1
      }},
    { $skip: (pageNum - 1) * pageLimit },
    { $limit: pageLimit },
    
  ];
  const options = {
    page: pageNum,
    limit: pageLimit,
    customLabels: {
      docs: "repliess",
      totalDocs: "total repliess",
      totalPages: "total pages",
      page: "current page",
    },
  };
  const replies= await Comment.aggregatePaginate(aggregateQuery, options);
  if (!replies) {
    throw new ApiError(404, "failed to find comments or no comments found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, replies, "commnets fetched successfully"));

});

export { getVideoComments, addComment, updateComment, deleteComment, getReplies };
