import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model.js";

const registerUser = asyncHandler(async (req, res) => {
  // get user details

  // validation -not empty
  // check if exists _ username, email
  // check if avatar and cover image
  // upload them to cloudinary
  // put limits to register
  //create user object - create entry n db
  // remove password  and refresh token field from response
  // check for user creation
  // return res

  const { email, password } = req.body;
  console.log("email: ", email, "password", password);

  if ([email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "some fields are empty");
  }

  const existedUser = await User.findOne({
    email: email,
  });

  if (existedUser) {
    throw new ApiError(409, "User with this email or username exists");
  }
  console.log("user Check ", existedUser);
  console.log(req.files);

  const user = await User.create({
    email,
    password,
    username:email.replace(/@.*$/, "")+ Date.now(),
  });

  const userExist = await User.findById(user._id).select(
    "-password -refreshToken -watchHistory"
  );

  if (!userExist) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }
  console.log("userCreated with data: ", userExist);
  return res
    .status(201)
    .json(new ApiResponse(200, userExist, "User created Successfully"));
});

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    console.log(accessToken, refreshToken);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.log(error);
    throw new ApiError(
      500,
      "something went wrong while generating refresh and access token"
    );
  }
};

const loginUser = asyncHandler(async (req, res) => {
  // get data form req -> data
  // username and email get any one
  // find the user
  // if user validate password
  // if not user throw error
  // if password matches login user
  // if password does not matches then throw error
  // send cookie and send response
  console.log(req.body);

  const { email, username, password } = req.body;

  if (!email && !username) {
    throw new ApiError(400, "username and email is required");
  }

  if (email) {
    let userExist = await User.findOne({
      email: email,
    });
    if (userExist) {
      const validPassword = await userExist.isPasswordCorrect(password);
      if (validPassword) {
        const { accessToken, refreshToken } =
          await generateAccessAndRefreshTokens(userExist._id);

        const loggedInUser = await User.findById(userExist._id).select(
          "-password -refreshToken"
        );

        const options = {
          httpOnly: true,
          secure: true,
        };

        return res
          .status(200)
          .cookie("accessToken", accessToken, options)
          .cookie("refreshToken", refreshToken, options)
          .json(
            new ApiResponse(
              200,
              { accessToken: accessToken, user: loggedInUser },

              "User loggedIN successfully "
            )
          );
      } else {
        throw new ApiError(400, "password is incorrect");
      }
    } else {
      throw new ApiError(400, "user does not exist");
    }
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  const UserToLogout = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  console.log(UserToLogout);

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
      throw new ApiError(401, "unauthorized request");
    }
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (user?.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken: accessToken,
          },
          "Access token refresh"
        )
      );
  } catch (error) {
    console.log(error);
    throw new ApiError(
      401,
      error.message || "something went wrong when generating tokens"
    );
  }
});

const createUser = asyncHandler(async (req, res) => {
  const { fullname, description, username } = req.body;
  const userId = req.user._id;
  const avatarLocalPath = req.files?.avatar[0]?.path;
  console.log(avatarLocalPath);
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0]?.path;
  }

  console.log(req.files, avatarLocalPath, coverImageLocalPath);
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file needed");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  console.log("avatar upload result on cloudinary : ", avatar);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  console.log("coverImage upload result : ", coverImage);
  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    {
      username: username,
      avatar: avatar.url,
      avatarPublicId: avatar.public_id,
      coverImage: coverImage?.url,
      coverImagePublicId: coverImage?.public_id,
      description: description,
      fullname: fullname,
    },
    { new: true }
  ).select("-password -refreshToken -avatarPublicId -coverImagePublicId");

  if (!user) {
    throw new ApiError("failed to create user");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "user created successfully"));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  console.log(req.body, oldPassword, newPassword);
  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "old password not correct");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password saved successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email, description } = req.body;
  if (!fullname || !email) {
    throw new ApiError(400, "field are empty");
  }
  const fields = {};
  if (fullname) fields.fullname = fullname;
  if (email) fields.email = email;
  if (description) fields.description;
  const user = await User.findByIdAndUpdate(req.user?._id, fields, {
    new: true,
  }).select("-password -refreshToken -avatarPublicId -coverImagePublicId");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "user details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.files?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar file missing");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }
  const oldPublicId = req?.user?.avatarPublicId;

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
        avatar: avatar.public_id,
      },
    },
    { new: true }
  ).select("-password -refreshToken -avatarPublicId -coverImagePublicId");
  const deleteResult = await deleteFromCloudinary(oldPublicId);
  console.log("old avatar deleted successfully : ", deleteResult);

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User Avatar Updated Successfully"));
});
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.files?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "cover image file missing");
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }
  console.log("old coverImageDeletedSuccessfully", deleteResult);
  const oldPublicId = req?.user?.coverImagePublicId;
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
        coverImagePublicId: coverImage.public_id,
      },
    },
    { new: true }
  ).select("-password -refreshToken -avatarPublicId -coverImagePublicId");

  const deleteResult = await deleteFromCloudinary(oldPublicId);
  console.log("old coverimage deleted : ", deleteResult);
  return res
    .status(200)
    .json(new ApiResponse(200, user, "user cover image updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  console.log("getUserChannleProfile ran");
  const { userId, username } = req.query;

  console.log(req.query);
  console.log(username, userId);

  if (!isValidObjectId(userId) && (!username || username.trim().length === 0)) {
    throw new ApiError(400, "Username or valid User ID is required");
  }
  const fields = {};
  if (username) {
    fields.username = username;
  }
  if (userId) {
    fields._id = new mongoose.Types.ObjectId(userId);
  }
  console.log(fields);
  const channels = await User.aggregate([
    {
      $match: { ...fields },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        as: "videos",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $in: [req.user?._id, "$subscribers.subscriber"],
        },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
        createdAt: 1,
        videos: {
          _id: 1,
          title: 1,
          thumbnail: 1,
          views: 1,
          duration: 1,
          videoFile: 1,
        },
      },
    },
  ]);
  console.log(username, userId);
  console.log(channels);

  if (channels.length === 0) {
    throw new ApiError(404, "Channel does not exist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channels[0], "User channel fetched successfully")
    );
});

const getUserWatchHistory = asyncHandler(async (req, res) => {
  const isLogined = req?.user;
  console.log("islogined : ", isLogined);
  if (!isLogined) {
    throw new ApiError(400, "User not Logged In");
  }

  const user = await User.aggregate([
    {
      $match: {
        _id: isLogined._id,
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    avatar: 1,
                    username: 1,
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
  ]);

  if (!user) {
    throw new ApiError(
      404,
      "user does not exist or watchHistory does not exist"
    );
  }
  console.log("user : ", user);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "user watchHistory added successfully"
      )
    );
});
const getUserPlaylists = asyncHandler(async (req, res) => {
  console.log(req.body);

  const { username } = req.body;

  if (!username) {
    throw new ApiError(400, "Invalid user ID.");
  }
  const user = await User.findOne({ username: username });
  if (!user) {
    throw new ApiError(400, "invalid username");
  }

  const playlists = await User.aggregate([
    {
      $match: { _id: user._id },
    },
    {
      $lookup: {
        from: "playlists",
        localField: "_id",
        foreignField: "owner",
        as: "userPlaylists",
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
        },
      },
    },
  ]);

  // Check if playlists are found
  if (playlists.length === 0) {
    throw new ApiError(404, "No playlists found for this user.");
  }

  // Return the user's playlists
  return res.status(200).json(
    new ApiResponse(
      200,
      playlists[0].userPlaylists, // Return user's playlists
      "Playlists fetched successfully."
    )
  );
});
const getUserTweets = asyncHandler(async (req, res) => {
  const { username } = req.body;

  const userTweets = await User.aggregate([
    { $match: { username: username } },
    {
      $lookup: {
        from: "tweets",
        localField: "_id",
        foreignField: "owner",
        as: " userTweets",
      },
    },
    {
      $project: {
        _id: 1,
        username: 1,
        userTweets: {
          _id: 1,
          content: 1,
          createdAt: 1,
        },
      },
    },
  ]);
  if (userTweets.length === 0) {
    throw new ApiError(500, "no tweets found for this user");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, userTweets[0], "User tweets fetched successfully")
    );
});

const toggleSubscribe = asyncHandler(async (req, res) => {
  const { targetId } = req.body;
  const userId = req?.user._id;
  const message = "";
  if (!targetId || !userId) {
    throw new ApiError(400, "fields may be missing");
  }
  const isSubscribed = await Subscription.findOne({
    subscriber: userId,
    channel: targetId,
  });
  if (isSubscribed) {
    const unSubscribe = await Subscription.findByIdAndDelete(isSubscribed._id);
    if (!unSubscribe) {
      throw new ApiError(500, "failed to unsubscribe, please try later");
    }
    message ="unsubscribed successfully";
  } else {
    const subscribe = await Subscription.create({
      channel: targetId,
      subscriber: userId,
    });
    if (!subscribe) {
      throw new ApiError(500, "failed to subscribe, please try later");
    }
    message="channel subscribed scessfully";
  }
  const subs = await Subscription.find({ channel: targetId });
  const subsCount = subs.length;
  return res
    .status(200)
    .josn(new ApiResponse(200, { subscribersCount: subsCount }, message));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getUserWatchHistory,
  updateAccountDetails,
  getUserPlaylists,
  getUserTweets,
  createUser,
  toggleSubscribe
};
