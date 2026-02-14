import { Router } from 'express';
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
} from '../controllers/user.controller.js';
import { requireBody } from '../middlewares/requireBody.middleware.js';

import { upload } from '../middlewares/multer.middleware.js';
import { verifyJwt } from '../middlewares/auth.middleware.js';
import {
  getUserRecommendation,
  getSubscribedVideos,
} from '../controllers/recommendation.controller.js';
import { likedVideo } from '../controllers/video.controller.js';
import {
  createUserValidator,
  toggleSubscribeValidator,
  searchUsersValidator,
  changePasswordValidator,
  updateAccountDetailsValidator,
} from '../validators/user.validators.js';

const userRouter = Router();

userRouter
  .route('/create')
  .put(verifyJwt, upload.single('avatar'), requireBody, createUserValidator, createUser);

userRouter
  .route('/change-password')
  .patch(verifyJwt, requireBody, changePasswordValidator, changeCurrentPassword);
userRouter
  .route('/update-account')
  .patch(verifyJwt, requireBody, updateAccountDetailsValidator, updateAccountDetails);

userRouter
  .route('/avatar')
  .patch(verifyJwt, upload.single('avatar'), requireBody, updateUserAvatar);

userRouter.route('/channel').get(verifyJwt, getUserChannelProfile);

userRouter.route('/history').get(verifyJwt, getUserWatchHistory);

userRouter.route('/playlists').get(getUserPlaylists);
userRouter.route('/recommendations').get(verifyJwt, getUserRecommendation);
// userRouter.route("/tweets").get(getUserTweets);
userRouter
  .route('/subscribe')
  .post(verifyJwt, requireBody, toggleSubscribeValidator, toggleSubscribe);
userRouter.route('/subscribed-videos').get(verifyJwt, getSubscribedVideos);
userRouter.route('/liked-videos').get(verifyJwt, likedVideo);
userRouter.route('/search').get(verifyJwt, searchUsersValidator, searchUsers);
export { userRouter };
