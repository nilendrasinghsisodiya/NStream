import nodeCron from "node-cron";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Playlist } from "../models/playlist.model.js";
import { PresistView } from "../models/view.model.js";
import { Like } from "../models/like.model.js";
import { Subscription } from "../models/subscription.model.js";
import mongoose from "mongoose";

/* strategy -> if we are deleting user then
delete PresistViews -> likes -> subscriptions -> comments ->playlists -> videos -> delete its video from cloudinary, thumbnail form cloudinary -> delete user avatar from cloundinary->then atlast delete the user */

/* strategy -> if deleting video -> first delete its all PresistViews -> delete its comments -> likes -> video and thumbnail from cloudinary -> atlast delete video */

// comment its direct
// playlist it is direct
// on avatar change delete form cloudinary sync or just create a new doc for it then delete mark it as delete (soft delete ) then delete it when the cron-job is runing*/

const deleteVideo = async (videoId, session) => {
  try {
    await session.startTransaction();
    await Comment.deleteMany({ video: videoId }).session(session);
    await Like.deleteMany({ targetId: videoId }).session(session);
    await PresistView.deleteMany({ targetId: videoId }).session(session);
    // Cloudinary deletion is external → cannot be in transaction
    await deleteFromCloudinary(videoId);
    await Video.deleteOne({ _id: videoId }).session(session);
    await session.commitTransaction();
  } catch (err) {
    console.log(`500::CRON:: failed to delete video ${videoId}`, err.message);
    await session.abortTransaction();
  } finally {
    await session.endSession();
  }
};

const deleteMarkedVideos = async () => {
  const markedVideos = await Video.find({ deleted: true });
  markedVideos.forEach(async (mv) => {
    const session = await mongoose.StartSession();
    deleteVideo(mv._id, session);
  });
};

const deleteUser = async (userId, session) => {
  try {
    await session.startTransaction();
    await Comment.deleteMany({ owner: userId }).session(session);
    await Playlist.deleteMany({ owner: userId }).session(session);
    const videos = await Video.find({ owner: userId });
    try {
      videos.forEach(async (v) => {
        const newSession = await mongoose.startSession();
        deleteVideo(v._id, newSession);
      });
    } catch (err) {
      console.error(
        `500::CRON:: some video deletion failed for user ${userId} aborting session`,
        err.message
      );
      await session.abortTransaction();
      throw new Error(err.message);
    }
    await Subscription.deleteMany({ subscriber: userId }).session(session);
    await Subscription.deleteMany({ channel: userId }).session(session);
    await User.findById(userId).session(session);
    await session.commitTransaction();
  } catch (error) {
    console.log(`500::CRON:: failed to delete user ${userId}`, error.message);
  } finally {
    await session.endSession();
  }
};

const deleteMarkedUser = async () => {
  const markedUser = await User.find({ deleted: true });
  markedUser.forEach(async (mu) => {
    const session = await mongoose.startSession();
    await deleteUser(mu._id, session);
  });
};

nodeCron.schedule("0 0 0 * * *", async () => {
  try {
    await deleteMarkedUser();
    await deleteMarkedVideos();
  } catch (error) {
    console.error(error.message);
  }
});
