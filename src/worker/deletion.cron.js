import nodeCron from 'node-cron';
import { User } from '../models/user.model.js';
import { Video } from '../models/video.model.js';
import { Comment } from '../models/comment.model.js';
import { Playlist } from '../models/playlist.model.js';
import { PresistView } from '../models/view.model.js';
import { Like } from '../models/like.model.js';
import { Subscription } from '../models/subscription.model.js';
import mongoose from 'mongoose';
import { LOCK_TIMEOUT } from '../constants.js';
import { deleteFromCloudinary } from '../utils/cloudinary.js';
/* strategy -> if we are deleting user then
delete PresistViews -> likes -> subscriptions -> comments ->playlists -> videos -> delete its video from cloudinary, thumbnail form cloudinary -> delete user avatar from cloundinary->then atlast delete the user */

/* strategy -> if deleting video -> first delete its all PresistViews -> delete its comments -> likes -> video and thumbnail from cloudinary -> atlast delete video */

// comment its direct
// playlist it is direct
// on avatar change delete form cloudinary sync or just create a new doc for it then delete mark it as delete (soft delete ) then delete it when the cron-job is runing*/

const deleteVideo = async (mv, session) => {
  const videoId = mv._id;
  try {
    session.startTransaction();
    await Comment.deleteMany({ video: videoId }).session(session);
    await Like.deleteMany({ targetId: videoId }).session(session);
    await PresistView.deleteMany({ targetId: videoId }).session(session);
    // Cloudinary deletion is external → cannot be in transaction

    await Video.findByIdAndDelete(videoId).session(session);
    await session.commitTransaction();
    await deleteFromCloudinary(mv.thumbnailPublicId);
    await deleteFromCloudinary(mv.videoPublicId);
  } catch (err) {
    await Video.findByIdAndUpdate(videoId, {
      $inc: {
        deletionTries: 1,
      },
    });
    console.log(`500::CRON:: failed to delete video ${videoId}`, err.message);

    await session.abortTransaction();
  } finally {
    await session.endSession();
  }
};

const deleteMarkedVideos = async () => {
  while (true) {
    const now = new Date();

    const video = await Video.findOneAndUpdate(
      {
        deleted: true,
        deletionTries: { $lt: 5 },
        $or: [{ deleteLock: { $ne: true } }, { lockAt: { $lt: new Date(now - LOCK_TIMEOUT) } }],
      },
      {
        $set: { deleteLock: true, lockAt: now },
      },
      { new: true },
    );

    if (!video) break; // nothing left to process

    const session = await mongoose.startSession();

    try {
      await deleteVideo(video, session);
    } catch (err) {
      // release lock on failure
      await Video.findByIdAndUpdate(video._id, {
        $set: { deleteLock: false },
      });
    }
  }
};
const deleteUser = async (userId, session) => {
  try {
    session.startTransaction();
    await Comment.deleteMany({ owner: userId }).session(session);
    await Playlist.deleteMany({ owner: userId }).session(session);

    await Video.updateMany({ owner: userId }, { $set: { deleted: true } }).session(session);
    await Subscription.deleteMany({ subscriber: userId }).session(session);
    await Subscription.deleteMany({ channel: userId }).session(session);
    await User.findByIdAndDelete(userId).session(session);
    await session.commitTransaction();
  } catch (error) {
    console.log(`500::CRON:: failed to delete user ${userId}`, error.message);
    await session.abortTransaction();
  } finally {
    await session.endSession();
  }
};

const deleteMarkedUser = async () => {
  const markedUser = await User.find({ deleted: true });
  for (const mu of markedUser) {
    const session = await mongoose.startSession();
    await deleteUser(mu._id, session);
  }
};

nodeCron.schedule('0 0 0 * * *', async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    await deleteMarkedUser();
    await deleteMarkedVideos();
  } catch (error) {
    console.error(error.message);
  }
});
