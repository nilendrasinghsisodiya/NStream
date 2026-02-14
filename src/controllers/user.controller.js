import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { isValidObjectId } from 'mongoose';
import { Subscription } from '../models/subscription.model.js';
import { escapeRegex } from '../utils/additionalUtils.js';
import { mongodbId } from '../utils/additionalUtils.js';

const createUser = asyncHandler(async (req, res) => {
  const { fullname, description } = req.body;
  const userId = req.user?._id;
  const isProfileComplete = req.user.isProfileComplete;
  if (isProfileComplete) {
    throw new ApiError(403, 'invalid operation');
  }
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, 'Avatar file is needed');
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath, `${userId}`);

  if (!avatar) {
    throw new ApiError(400, 'Avatar file is required');
  }

  const user = await User.findByIdAndUpdate(
    userId,
    {
      avatar: avatar.url,
      avatarPublicId: avatar.public_id,
      description: description,
      fullname: fullname,
      isProfileComplete: true,
    },
    { new: true },
  ).select('-password -accessToken -refreshToken -avatarPublicId -deleted');

  if (!user) {
    throw new ApiError('failed to create user');
  }

  return res.status(200).json(new ApiResponse(200, user, 'user created successfully'));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(401, 'old password not correct');
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, {}, 'password saved successfully'));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, req.user, 'current user fetched successfully'));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, description } = req.body;
  if (!(fullname || description)) {
    throw new ApiError(400, 'field are empty');
  }
  const fields = {};
  if (fullname) fields.fullname = fullname;
  if (description) fields.description = description;
  const user = await User.findByIdAndUpdate(req.user?._id, fields, {
    new: true,
  }).select('-password -accessToken -refreshToken -avatarPublicId');

  return res.status(200).json(new ApiResponse(200, user, 'user details updated successfully'));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  const userId = req.user?._id;
  if (!avatarLocalPath) {
    throw new ApiError(400, 'avatar file missing');
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath, userId);
  if (!avatar.url) {
    throw new ApiError(400, 'Error while uploading on avatar');
  }
  const oldPublicId = req?.user?.avatarPublicId;

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
        avatarPublicId: avatar.public_id,
      },
    },
    { new: true },
  ).select('-password -accessToken -refreshToken -avatarPublicId');
  await deleteFromCloudinary(oldPublicId);

  return res.status(200).json(new ApiResponse(200, user, 'User Avatar Updated Successfully'));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { userId, username } = req.query;

  if (!isValidObjectId(userId) && !username.trim()) {
    throw new ApiError(400, 'Username or valid User ID is required');
  }
  const fields = {};
  if (username) {
    fields.username = username;
  }
  let ChannelId = undefined;
  if (!userId) {
    const user = await User.findOne({ username: username });
    ChannelId = user?.id;
  }
  if (userId) {
    fields._id = mongodbId(userId);
  }
  const channels = await User.aggregate([
    {
      $match: { ...fields },
    },
    {
      $lookup: {
        from: 'videos',
        localField: '_id',
        foreignField: 'owner',
        as: 'videos',
      },
    },
    {
      $lookup: {
        from: 'subscriptions',
        localField: '_id',
        foreignField: 'channel',
        as: 'subscribers',
      },
    },
    {
      $lookup: {
        from: 'subscriptions',
        localField: '_id',
        foreignField: 'subscriber',
        as: 'subscribedTo',
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: '$subscribers',
        },
        channelsSubscribedToCount: {
          $size: '$subscribedTo',
        },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        subscribersCount: '$subscribersCount',
        channelsSubscribedToCount: '$channelSubscribedToCount',

        avatar: 1,
        videos: {
          _id: '$videos._id',
          thumbnail: '$videos.thumbnail',
          title: '$videos.title',
          views: '$videos.views',
        },
        description: 1,
        email: 1,
        createdAt: 1,
      },
    },
  ]);

  if (channels.length === 0) {
    throw new ApiError(404, 'Channel does not exist');
  }

  const isSubscribed = await Subscription.findOne({
    subscriber: req.user?._id,
    channel: ChannelId,
  });
  // userId is the channelId for that particular channel
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { ...channels[0], isSubscribed: isSubscribed ? true : false },
        'User channel fetched successfully',
      ),
    );
});

const getUserWatchHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const history = await User.aggregate([
    {
      $match: {
        _id: userId,
      },
    },
    { $limit: 50 },
    {
      $lookup: {
        from: 'videos',
        as: 'historyVideos',
        localField: 'watchHistory',
        foreignField: '_id',
        pipeline: [
          {
            $lookup: {
              from: 'users',
              localField: 'owner',
              foreignField: '_id',
              as: 'vidOwner',
            },
          },
          {
            $unwind: {
              path: '$vidOwner',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              thumbnail: 1,
              title: 1,
              views: 1,
              duration: 1,
              owner: {
                avatar: '$vidOwner.avatar',
                _id: '$vidOwner._id',
                username: '$vidOwner.username',
                subscribersCount: '$vidOwner.subscribersCount',
              },
            },
          },
        ],
      },
    },
    {
      $unwind: {
        path: '$historyVideos',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        historyVideos: 1,
      },
    },
  ]);
  const historyVideos = history.map((h) => h.historyVideos);
  return res
    .status(200)
    .json(new ApiResponse(200, historyVideos, 'user watchHistory fetched successfully'));
});
const getUserPlaylists = asyncHandler(async (req, res) => {
  const { username } = req.query;

  if (!username) {
    throw new ApiError(400, 'Invalid user ID.');
  }
  const user = await User.findOne({ username: username });
  if (!user) {
    throw new ApiError(400, 'invalid username');
  }
  const playlists = await User.aggregate([
    {
      $match: { _id: user._id },
    },
    {
      $lookup: {
        from: 'playlists',
        localField: '_id',
        foreignField: 'owner',
        as: 'userPlaylists',
      },
    },
    {
      $unwind: {
        path: '$userPlaylists',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        'userPlaylists.videos': {
          $ifNull: ['$userPlaylists.videos', []],
        },
      },
    },
    {
      $lookup: {
        from: 'videos',
        let: { videoIds: '$userPlaylists.videos' },
        pipeline: [
          { $match: { $expr: { $in: ['$_id', '$$videoIds'] } } },
          { $project: { thumbnail: 1, duration: 1 } },
          { $limit: 1 },
        ],
        as: 'playlistCover',
      },
    },
    {
      $addFields: {
        'userPlaylists.cover': {
          $arrayElemAt: ['$playlistCover.thumbnail', 0],
        },
      },
    },
    {
      $match: {
        $expr: {
          $and: [{ $ne: ['$userPlaylists', null] }, { $ne: ['$userPlaylists', {}] }],
        },
      },
    },
    {
      $group: {
        _id: '$_id',
        username: { $first: '$username' },
        avatar: { $first: '$avatar' },
        userPlaylists: { $push: '$userPlaylists' },
      },
    },
    {
      $project: {
        _id: 1,
        username: 1,
        avatar: 1,
        userPlaylists: {
          _id: 1,
          name: 1,
          description: 1,
          cover: 1,
        },
      },
    },
  ]);

  // Check if playlists are found
  if (playlists.length === 0) {
    throw new ApiError(404, 'No playlists found for this user.');
  }
  const userPlaylists = playlists[0].userPlaylists.filter((p) => p && Object.keys(p).length);
  // Return the user's playlists
  return res.status(200).json(
    new ApiResponse(
      200,
      { playlists: userPlaylists }, // Return user's playlists
      'Playlists fetched successfully.',
    ),
  );
});

const searchUsers = asyncHandler(async (req, res) => {
  const userId = req?.user?._id;
  const { page = 1, limit = 10, query } = req.query;

  const filter = {};
  if (query) {
    filter.username = { $regex: escapeRegex(query), $options: 'i' };
  }

  const pageNum = parseInt(page);
  const pageLimit = parseInt(limit);

  const isLoggedIn = !!userId;

  const aggregateQuery = User.aggregate([
    {
      $match: {
        ...filter,
      },
    },
    {
      $lookup: {
        from: 'subscriptions',
        let: { channelId: '$_id' }, // the user being searched
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$channel', '$$channelId'] },
                  ...(isLoggedIn ? [{ $eq: ['$subscriber', mongodbId(userId)] }] : []),
                ],
              },
            },
          },
        ],
        as: 'subscriptionInfo',
      },
    },
    {
      $addFields: {
        isSubscribed: { $gt: [{ $size: '$subscriptionInfo' }, 0] },
      },
    },
    {
      $project: {
        _id: 1,
        username: 1,
        avatar: 1,
        subscribersCount: 1,
        isSubscribed: 1,
      },
    },
  ]);

  const options = {
    limit: pageLimit,
    page: pageNum,
    customLabels: {
      page: 'currentPage',
      totalDocs: 'totalChannels',
      docs: 'Channels',
    },
  };

  const channels = await User.aggregatePaginate(aggregateQuery, options);

  return res.status(200).json(new ApiResponse(200, channels, 'channel searched successfully'));
});

const toggleSubscribe = asyncHandler(async (req, res) => {
  const { targetId } = req.body;
  const userId = req?.user?._id;
  let message = '';
  let flag = undefined;

  if (!targetId || !userId) {
    throw new ApiError(400, 'Fields may be missing');
  }

  const isSubscribed = await Subscription.findOne({
    subscriber: userId,
    channel: targetId,
  });

  if (isSubscribed) {
    await Subscription.findByIdAndDelete(isSubscribed._id);
    message = 'Unsubscribed successfully';
    User.findByIdAndUpdate({ _id: targetId }, { $inc: { subscribersCount: -1 } });
    flag = false;
  } else {
    await Subscription.create({ channel: targetId, subscriber: userId });
    User.findByIdAndUpdate({ _id: targetId }, { $inc: { subscribersCount: 1 } });
    message = 'Channel subscribed successfully';
    flag = true;
  }

  // Get updated subscriber count separately (fast, but may have slight delays)
  const subscribersCount = await Subscription.countDocuments({
    channel: targetId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { subscribersCount: subscribersCount, inc: flag }, message));
});

export {
  changeCurrentPassword,
  getCurrentUser,
  updateUserAvatar,
  getUserChannelProfile,
  getUserWatchHistory,
  updateAccountDetails,
  getUserPlaylists,
  createUser,
  toggleSubscribe,
  searchUsers,
};
