import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

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
  //TODO: create playlist
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId, page, limit = 5 } = req.query;
  //TODO: get playlist by id

  const pageNum = Number(page);
  const pageLimit = Number(limit);
  const isValidId = isValidObjectId(playlistId);
  if (!isValidId) {
    throw new ApiError(400, "not a valid playlistId");
  }
  const aggregateQuery = Playlist.aggregate([
    {
      $match: new mongoose.Types.ObjectId(playlistId),
    },
    {
      $lookup: {
        localField: "videos",
        foreignField: "_id",
        from: "videos",
        as: "videos",
      },
    },
    { $unwind: "videos" },
    {
      $project: {
        _id: 1,
        view: 1,
        name: 1,
        description: 1,
        videos: {
          _id: "$videos._id",
          thumbnail: "$videos._thumbnail",
          owner: "$videos.owner",
          title: "$videos.title",
          view: "$videos.view",
        },
        created_at: 1,
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
  const playlist = await Playlist.aggregatepaginate(aggregateQuery, options);
  console.log(playlist);

  return res
    .status(200)
    .json(new ApiResponse(200, playlist[0], "playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const userId = req?.user?._id;
  if (!userId) {
    throw new ApiError(401, "unauthorized access");
  }
  const { playlistId, videos } = req.body;

  const isValidPlaylistId = isValidObjectId(playlistId);
  if (!isValidPlaylistId) {
    throw new ApiError(400, "invalid Playlist id");
  }
  if (!Array.isArray(videos) || videos.length === 0) {
    throw new ApiError(400, "Invalid or empty videos array");
  }
  console.log("req.body.videos : ", videos);

  const validVideos = [];

  videos.forEach((element) => {
    if (isValidObjectId(element)) {
      validVideos.push(element);
    }
  });
  console.log("valid videos array : ", validVideos);
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $addToSet: {
        videos: { $each: validVideos },
      },
    },
    {
      new: true,
    }
  );

  console.log("updated playlist : ", updatedPlaylist);
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
  // TODO: remove video from playlist
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "invalid playlist or video id");
  }
  if (!req?.user?._id) {
    throw new ApiError(
      400,
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
      400,
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
  // TODO: delete playlist
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
  console.log(deleteRes);
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
  //TODO: update playlist
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
  if (!updatePlaylist) {
    throw new ApiError(500, "failed to update the playlist");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatePlaylist, "playlist updated successfully")
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
