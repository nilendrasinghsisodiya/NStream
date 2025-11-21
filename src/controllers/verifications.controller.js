import { redis } from "../redis/redis.setup.js";
import { otpQueue } from "../messageQueue/bullmq.setup.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { generateOtp } from "../utils/additionalUtils.js";
import { isValidObjectId } from "mongoose";
import { expireOtp, populateOtp } from "../utils/optutils.js";

const getOtpSignUp = asyncHandler(async (req, res) => {
  const { _id: id, email, isVerified } = req.user;
  if (!id || !isValidObjectId(id)) {
    throw new ApiError(400, "invalid or empty objectId");
  }

  if (isVerified) {
    const otp = generateOtp();
    const otpState = populateOtp(id, false, false, otp);
    const key = `otp::su::${id}`;
    await redis.hset(key, otpState);
    await expireOtp(key, 300, "GT");
    await otpQueue.add("optTask", {
      usermail: email,
      otp: otp,
    });
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "200:: opt generated sucessfully"));
  } else {
    throw new ApiError(403, "forbidden access");
  }
});
const verifyOtpSignUp = asyncHandler(async (req, res) => {
  const { _id: id } = req.user;
  const { otp } = req.body;
  if (!id || !isValidObjectId(id)) {
    throw new ApiError(400, "invalid or empty id");
  }

  const otpState = await redis.hgetall(`otp::su::${id}`);
  if (!otpState) {
    throw new ApiError(400, "expired otp");
  }
  if (otp === otpState.otp) {
    const newOtpState = populateOtp(id, true, false, 0);
    const key = `otp::su::${id}`;
    await redis.hset(key, newOtpState);
    await redis.hexpire(key, 600, "GT");
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "verification successfull"));
  }
  throw new ApiError(400, "invalid otp or expired otp");
});
const getOtpDelete = asyncHandler(async (req, res) => {
  const { _id: id, email } = req.user;
  const otp = generateOtp();
  const otpState = populateOtp(id, false, false);
  const key = `otp::de::${id}`;
  await redis.hset(key, otpState);
  await expireOtp(key, 300, "GT");
  await otpQueue.add(`optTask`, { useremail: email, otp });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "otp for user deletion generated"));
});

const verifyOtpDelete = asyncHandler(async (req, res) => {
  const { _id: id } = req.user;
  const { otp } = req.body;
  const otpState = await redis.hgetall(`otp::de::${id}`);
  if (!otpState || !otpState.isUsed) {
    throw new ApiError(400, "invalid or expired otp");
  }
  if (otp !== otpState) {
    throw new ApiError(400, "invalid otp");
  }

  const newOtpState = populateOtp(id, true, false);
  const key = `otp::de::${id}`;
  await redis.hset(key, newOtpState);
  await expireOtp(key, 600, "GT");
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "verfication successfull"));
});

const getOtpForgetPassword = asyncHandler(async (req, res) => {
  const { _id: id, email } = req.user;
  const otp = generateOtp();
  const otpState = populateOtp(id, false, false);
  const key = `otp::fp::${id}`;
  await redis.hset(key, otpState);
  await expireOtp(key, 300, "GT");
  await otpQueue.add(`optTask`, { useremail: email, otp });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "otp for user deletion generated"));
});
const verifyOtpForgetPassword = asyncHandler(async (req, res) => {
  const { _id: id } = req.user;
  const { otp } = req.body;
  const otpState = await redis.hgetall(`otp::fp::${id}`);
  if (!otpState || !otpState.isUsed) {
    throw new ApiError(400, "invalid or expired otp");
  }
  if (otp !== otpState) {
    throw new ApiError(400, "invalid otp");
  }

  const newOtpState = populateOtp(id, true, false);
  const key = `otp::fp::${id}`;
  await redis.hset(key, newOtpState);
  await expireOtp(key, 600, "GT");
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "verfication successfull"));
});

export {
  getOtpSignUp,
  verifyOtpSignUp,
  getOtpDelete,
  getOtpForgetPassword,
  verifyOtpDelete,
  verifyOtpForgetPassword,
};
