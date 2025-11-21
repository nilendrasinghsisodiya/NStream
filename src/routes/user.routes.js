import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  updateAccountDetails,
  updateUserAvatar,
  getUserChannelProfile,
  getUserWatchHistory,
  getUserPlaylists,
  // getUserTweets,
  createUser,
  toggleSubscribe,
  searchUsers
} from "../controllers/user.controller.js";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { getUserRecommendation,getSubscribedVideos } from "../controllers/recommendation.controller.js";
import { likedVideo } from "../controllers/video.controller.js";
import {createUserValidator,loginValidator,signUpValidator,toggleSubscribeValidator,searchUsersValidator,changePasswordValidator,updateAccountDetailsValidator} from "../validators/user.validators.js"

const router = Router();


router.route("/register").post(signUpValidator, registerUser);

router.route("/login").post(loginValidator, loginUser);

// secured routes

router.route("/logout").post(verifyJwt, logoutUser);

router.route("/create").put(
  verifyJwt,
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 }
  ]),
  createUserValidator,
  createUser
);

router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").patch(verifyJwt,changePasswordValidator, changeCurrentPassword);
router.route("/update-account").patch(verifyJwt, updateAccountDetailsValidator,updateAccountDetails);

router
  .route("/avatar")
  .patch(verifyJwt, upload.single("avatar"),updateUserAvatar);


router.route("/channel").get(verifyJwt,getUserChannelProfile);

router.route("/history").get(verifyJwt, getUserWatchHistory);

router.route("/playlists").get(getUserPlaylists);
router.route("/recommendations").get(verifyJwt, getUserRecommendation);
// router.route("/tweets").get(getUserTweets);
router.route("/subscribe").post(verifyJwt,toggleSubscribeValidator,toggleSubscribe);
router.route("/subscribedVideos").get(verifyJwt,getSubscribedVideos);
router.route("/liked-videos").get(verifyJwt,likedVideo);
router.route("/search").get(verifyJwt,searchUsersValidator,searchUsers);
export default router;
