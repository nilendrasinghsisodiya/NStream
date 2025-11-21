import { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { mongodbId } from "../utils/additionalUtils.js";
const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const userId = req?.user?._id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized Access");
  }

  if (!name || !description) {
    throw new ApiError(400, "Playlist name and description is required");
  }
  const playlist = await Playlist.create({
    name: name,
    description: description,
    owner: userId,
  });

  if (!playlist) {
    throw new ApiError(500, "failed to create playlist");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "playlist created successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId, page, limit = 5 } = req.query;
  const pageNum = Number(page);
  const pageLimit = Number(limit);
  const isValidId = isValidObjectId(playlistId);
  if (!isValidId) {
    throw new ApiError(400, "not a valid playlistId");
  }

  const aggregateQuery = Playlist.aggregate([
    {
      $match: {
        _id: mongodbId(playlistId),
      },
    },
    {
      $lookup: {
        from: "videos",
        let: { videoIds: "$videos" },
        pipeline: [
          {
            $match: {
              $expr: { $in: ["$_id", "$$videoIds"] },
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
          { $unwind: "$owner" },
          {
            $project: {
              _id: 1,
              title: 1,
              thumbnail: 1,
              views: 1,
              duration: 1,
              likesCont: 1,

              owner: {
                _id: "$owner._id",
                avatar: "$owner.avatar",
                username: "$owner.username",
                subscribersCount: "$owner.subscribersCount",
              },
            },
          },
        ],
        as: "videos",
      },
    },
    {
      $project: {
        _id: 1,
        view: 1,
        name: 1,
        owner: 1,
        duration: 1,
        description: 1,
        created_at: 1,
        videos: "$videos",
      },
    },
  ]);
  const options = {
    page: pageNum,
    limit: pageLimit,
    customLabels: {
      docs: "playlistVideos",
      totalDocs: "total playlistVideos",
      totalPages: "total pages",
      page: "current page",
    },
  };
  const playlist = await Playlist.aggregatePaginate(aggregateQuery, options);
  await Playlist.findOneAndUpdate({ _id: playlistId }, { $inc: { view: 1 } });
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { playlist: playlist.playlistVideos[0] },
        "playlist fetched successfully"
      )
    );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoIds } = req.body;
  const userId = req?.user?._id;
  const playlist = await Playlist.findById({ _id: playlistId });
  const isOwner = playlist.isOwner(userId);
  if (!isOwner) {
    throw new ApiError(403, "forbidden access");
  }

  const isValidPlaylistId = isValidObjectId(playlistId);
  if (!isValidPlaylistId) {
    throw new ApiError(400, "invalid Playlist id");
  }
  if (!Array.isArray(videoIds) || videoIds.length === 0) {
    throw new ApiError(400, "Invalid or empty videos array");
  }

  const validVideos = videoIds.filter((ele) => isValidObjectId(ele));

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    { _id: playlistId },
    {
      $addToSet: {
        videos: { $each: validVideos },
      },
    },
    {
      new: true,
    }
  );

  if (!updatedPlaylist) {
    throw new ApiError(500, "failded to add vidoes to playlist");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "Videos added successfully to the playlist"
      )
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.body;
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "invalid playlist or video id");
  }
  if (!req?.user?._id) {
    throw new ApiError(
      401,
      "you need to be logged in to remove a video from a playlist"
    );
  }
  const playlist = await Playlist.findById(playlistId);
  const isOwner = playlist.isOwner(req.user._id);
  if (!playlist) {
    throw new ApiError(400, "playlist does not exist");
  }
  if (!isOwner) {
    throw new ApiError(
      403,
      "you need to be owner to remove a video from a playlist"
    );
  }
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: { vidoes: videoId },
    },
    { new: true }
  );
  if (!updatedPlaylist) {
    throw new ApiError(500, "failed to remove video");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatePlaylist,
        "video removed from playlist sucessfully"
      )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.body;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "invalid playlist id");
  }
  const userId = req?.user?._id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized Access");
  }
  const playlist = await Playlist.findById(playlistId);
  const isOwner = playlist.isOwner(userId);
  if (!isOwner) {
    throw new ApiError(403, "Access forbidden");
  }

  const deleteRes = await Playlist.findByIdAndDelete(playlistId);
  if (!deleteRes) {
    throw new ApiError(500, "falied to delete playlist");
  }
  return res
    .status(204)
    .json(new ApiResponse(204, {}, "playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.body;
  const { name, description } = req.body;
  const userId = req?.user?._id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized Access");
  }
  if (!isValidObjectId(playlist)) {
    throw new ApiError(400, "invalid playlist id");
  }
  const playlist = Playlist.findById(playlistId);
  const isOwner = playlist.isOwner(userId);
  if (!isOwner) {
    throw new ApiError(403, "you have to be owner to update the playlist");
  }
  const updatedDetails = {};
  if (name) {
    updatedDetails.name = name;
  }
  if (description) {
    updatedDetails.description = description;
  }
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    { _id: playlistId },
    {
      $set: updatedDetails,
    },
    { new: true }
  );
  if (!updatedPlaylist) {
    throw new ApiError(500, "failed to update the playlist");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlaylist, "playlist updated successfully")
    );
});

export {
  createPlaylist,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
