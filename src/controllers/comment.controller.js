import mongoose, { isValidObjectId, Mongoose, Types } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.query;
  const userId = req?.user?._id;
  console.log("userID",userId)
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortType = "asc",
  } = req.query;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "invalid videoId");
  }

  const pageNum = Number(page);
  const pageLimit = Number(limit);
  const sortOrder = sortType === "asc" ? 1 : -1;

const aggregateQuery = Comment.aggregate([
  { $match: { video: new Types.ObjectId(videoId) } },
  
  
  {
    $lookup: {
      from: "likes",
      localField: "_id",
      foreignField: "comment",
      as: "likes"
    }
  },

  
  {
    $lookup: {
      from: "users",
      localField: "owner",
      foreignField: "_id",
      as: "ownerDetails"
    }
  },
  { $unwind: "$ownerDetails" },

  
  {
    $addFields: {
      likeCount: { $size: "$likes" },
      videoId:{videoId},
      isLiked: {
        $cond: {
          if: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: "$likes",
                    as: "like",
                    cond: {
                      $eq: ["$$like.likedBy",userId]
                    }
                  }
                }
              },
              0
            ]
          },
          then: true,
          else: false
        }
      }
    }
  },

  {
    $project: {
      _id: 1,
      content: 1,
      createdAt: 1,
      likeCount: 1,
      isLiked: 1,
      owner: {
        _id: "$ownerDetails._id",
        avatar: "$ownerDetails.avatar",
        username: "$ownerDetails.username"
      }
    }
  },

  { $sort: { [sortBy]: sortOrder } }
]);


  const options = {
    page: pageNum,
    limit: pageLimit,
    customLabels: {
      docs: "comments",
      totalDocs: "totalComments",
      totalPages: "totalPages",
      page: "currentPage",
    },
  };

  const comments = await Comment.aggregatePaginate(aggregateQuery, options);

  if (!comments || comments.comments.length === 0) {
    throw new ApiError(404, "No comments found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId, content } = req.body;
  const userId = req?.user?._id;
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
  const userId = req?.user?._id;
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
  if (!isOwner) {
    throw new ApiError(401, "unauthroized request");
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
  const { commentId } = req.query;
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

const getReplies = asyncHandler(async (req, res) => {
  const { commentId } = req.query;
  const userId = req?.user?._id;
  console.log(commentId);
  const { page = 1, limit = 10 } = req.query;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "invalid videoId");
  }
  const pageNum = Number(page);
  const pageLimit = Number(limit);

  const aggregateQuery = Comment.aggregate([
    { $match: { comment: new Types.ObjectId(commentId) } },
    {
      $lookup: {
        from: "likes",
        localField: "owner",
        foreignField: "likedBy",
        as: "likes",
      },
    },
    {
      $addFields: {
        likeCount: { $size: "$likes" }, 
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
        content: 1,
        createdAt: 1,
        owner: 1,
        likeCount: 1,
        isLiked: 1,
      },
    },
  ]);
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
  const replies = await Comment.aggregatePaginate(aggregateQuery, options);
  if (!replies) {
    throw new ApiError(404, "failed to find comments or no comments found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, replies, "commnets fetched successfully"));
});
const addReply = asyncHandler(async (res,req)=>{
  
    const { videoId, content,commentId } = req.body;
    const userId = req?.user?._id;
    if (!userId) {
      throw new ApiError(401, "Unauthorzied access");
    }
  
    if (!isValidObjectId(videoId)) {
      throw new ApiError(400, "not a Valid video Id");
    }
    if (!content) {
      throw new ApiError(400, "Empty or invalid content");
    }
  
    const reply = await Comment.create({
      content: content,
      video: videoId,
      comment:commentId,
      owner: userId,
    });
    if (!reply) {
      throw new ApiError(500, "Failed to create a reply");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, reply, "reply created successfully"));

})
export {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment,
  getReplies,
  addReply
};
