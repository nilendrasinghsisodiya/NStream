import { Router } from "express";
import {
  changeCurrentPassword,
  updateAccountDetails,
  updateUserAvatar,
  getUserChannelProfile,
  getUserWatchHistory,
  getUserPlaylists,
  createUser,
  toggleSubscribe,
  searchUsers,
} from "../controllers/user.controller.js";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  getUserRecommendation,
  getSubscribedVideos,
} from "../controllers/recommendation.controller.js";
import { likedVideo } from "../controllers/video.controller.js";
import {
  createUserValidator,
  toggleSubscribeValidator,
  searchUsersValidator,
  changePasswordValidator,
  updateAccountDetailsValidator,
} from "../validators/user.validators.js";

const userRouter = Router();

userRouter.route("/create").put(
  verifyJwt,
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  createUserValidator,
  createUser
);

userRouter
  .route("/change-password")
  .patch(verifyJwt, changePasswordValidator, changeCurrentPassword);
userRouter
  .route("/update-account")
  .patch(verifyJwt, updateAccountDetailsValidator, updateAccountDetails);

userRouter
  .route("/avatar")
  .patch(verifyJwt, upload.single("avatar"), updateUserAvatar);

userRouter.route("/channel").get(verifyJwt, getUserChannelProfile);

userRouter.route("/history").get(verifyJwt, getUserWatchHistory);

userRouter.route("/playlists").get(getUserPlaylists);
userRouter.route("/recommendations").get(verifyJwt, getUserRecommendation);
// userRouter.route("/tweets").get(getUserTweets);
userRouter
  .route("/subscribe")
  .post(verifyJwt, toggleSubscribeValidator, toggleSubscribe);
userRouter.route("/subscribedVideos").get(verifyJwt, getSubscribedVideos);
userRouter.route("/liked-videos").get(verifyJwt, likedVideo);
userRouter.route("/search").get(verifyJwt, searchUsersValidator, searchUsers);
export { userRouter };
