import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getUserWatchHistory,
  getUserPlaylists,
  getUserTweets,
  createUser
} from "../controllers/user.controller.js";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {getUserRecommendation} from '../controllers/recommendation.controller.js';
import { createUserValidator,loginValidator } from "../validation.js";
const router = Router();

router.route("/register").post(
 loginValidator,
  registerUser
);

router.route("/login").post(loginValidator,loginUser);

// secured routes

router.route("/logout").post(verifyJwt, logoutUser);

router.route("/create").put(verifyJwt,createUserValidator,createUser);

router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").patch(verifyJwt, changeCurrentPassword);
router.route("/current-user").get(verifyJwt, getCurrentUser);
router.route("/update-account").patch(verifyJwt, updateAccountDetails);

router
  .route("/avatar")
  .patch(verifyJwt, upload.single("avatar"), updateUserAvatar);

router
  .route("cover-image")
  .patch(verifyJwt, upload.single("coverImage"), updateUserCoverImage);

router.route("/channel").get( getUserChannelProfile);

router.route("/history").get(verifyJwt, getUserWatchHistory);

router.route("/playlists").get(getUserPlaylists);
router.route("/recommendations").get(verifyJwt, getUserRecommendation);
router.route("/tweets").get(getUserTweets);



export default router;
