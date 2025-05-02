import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
export const verifyJwt = asyncHandler(async (req, res, next) => {
  try {
    console.log("cookie",req.cookies);
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    console.log("token", token);
    const isOptional = req.header("Optional");
    console.log("optional", isOptional);
    if (!token && isOptional === "true") {
      req.user = null;
      console.log(
        "optional request forawading without auth because of absence of the token"
      );
      next();
      return;
    }

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }
    req.user = user;
    return next();
  } catch (error) {
    if (error.message === "jwt expired") {
      throw new ApiError(
        493,
        "accessToken expired, please relogin or refresh the token"
      );
    } else {
      throw new ApiError(401, error.message || "invalid accessToken");
    }
  }
});
