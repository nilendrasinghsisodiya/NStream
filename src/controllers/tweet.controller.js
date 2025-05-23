import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "No content provided for tweet");
  }
  const userId = req?.user?._id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized access");
  }
  const tweet = await Tweet.create({
    content: content,
    owner: userId,
  });
  if (!tweet) {
    throw new ApiError(400, "Tweet creation failed");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "tweet created succesfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { tweetId } = req.body;
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet id");
  }
  const oldTweet = await Tweet.findById(tweetId);
  if (!oldTweet) {
    throw new ApiError(400, "no tweet found for this id");
  }
  const userId = req?.user?._id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized access");
  }

  const isOwner = oldTweet.isOwner(userId);
  if (!isOwner) {
    throw new ApiError(400, "you have to be owner to update tweet");
  }
  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "no content provided");
  }
  const updatedTweet = await Tweet.findByIdAndUpdate(
    { _id: tweetId },
    {
      $set: {
        content: content,
      },
    },
    {
      new: true,
    }
  );
  if (!updatedTweet) {
    throw new ApiError(500, "Failed to Upadate tweet");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.body;
  const userId = req?.user?._id;
  if (!userId) {
    throw new ApiError(401, "Unauthorzied access");
  }
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "invalid tweet Id");
  }
  const tweet = Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "tweet with this tweetId not found");
  }

  const isOwner = tweet.isOwner(userId);
  if (!isOwner) {
    throw new ApiError(403, "you have to be owner to delete a tweet");
  }
  const deleteRes = await Tweet.findByIdAndDelete(tweetId);
  if (!deleteRes) {
    throw new ApiError(500, "failed to  deleted tweet");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "tweet deleted successfully"));
});

export { createTweet, updateTweet, deleteTweet };
