import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

const registerUser = asyncHandler(async (req, res) => {
  const { email, password, username } = req.body;

  if ([email, password, username].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "some fields are empty");
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    throw new ApiError(409, "User with this email or username exists");
  }

  const user = await User.create({
    email,
    password,
    username,
    subscribersCount: 0,
    isProfileComplete: false,
  });
  console.log("user");
  const userExist = await User.findById(user._id).select(
    "-password -refreshToken -watchHistory"
  );

  if (!userExist) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, userExist, "User created Successfully"));
});

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while generating refresh and access token"
    );
  }
};

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    throw new ApiError(400, "email is required");
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
          "-password -refreshToken -avatarPublicId -coverImagePublicId"
        );

        const options = {
          httpOnly: true,
          secure: true,
          sameSite: "None",
        };

        const result = { ...loggedInUser._doc, accessToken: accessToken };

        return res
          .status(200)
          .cookie("accessToken", accessToken, options)
          .cookie("refreshToken", refreshToken, options)
          .json(new ApiResponse(200, result, "User loggedIN successfully "));
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
    sameSite: "None",
  };

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
      throw new ApiError(
        401,
        "unauthorized request no valid refresh token found"
      );
    }
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (user?.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
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
    throw new ApiError(
      401,
      error.message || "something went wrong when generating tokens"
    );
  }
});

export { loginUser, registerUser, refreshAccessToken, logoutUser };
