import { Router } from "express";
import {
  deleteVideo,
  searchVideos,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
} from "../controllers/video.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { getVideoComments } from "../controllers/comment.controller.js";
import {
  getRelatedVideos,
  getPopularVideos,
  getSubscribedVideos,
} from "../controllers/recommendation.controller.js";
import { videoUploadValidtors } from "../validators/video.validators.js";
const videoRouter = Router();

videoRouter.route("/").post(
  verifyJwt,
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  videoUploadValidtors,
  publishAVideo
);

videoRouter.route("/search").get(searchVideos);

videoRouter
  .route("/update")
  .patch(verifyJwt, upload.single("thumbnail"), updateVideo);

videoRouter.route("/toggle/publish").patch(verifyJwt, togglePublishStatus);
videoRouter
  .route("/")
  .get(verifyJwt, getVideoById)
  .delete(verifyJwt, deleteVideo);
videoRouter.route("/related").get(getRelatedVideos);
videoRouter.route("/popular").get(getPopularVideos);
videoRouter.route("/comments").get(verifyJwt, getVideoComments);

export { videoRouter };
