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
import { getRelatedVideos } from "../controllers/recommendation.controller.js";

const router = Router();


router
  .route("/")
  .post( verifyJwt,
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
    publishAVideo
  );

  router.route('/search').get(searchVideos);
  
  router.route("/comments").get(getVideoComments);
  
  router
  .route("/update/")
  .patch(verifyJwt,upload.single("thumbnail"), updateVideo);
  
  router.route("/toggle/publish").patch(verifyJwt,togglePublishStatus);
  router.route("/").get(getVideoById).delete(verifyJwt,deleteVideo);
  router.route("/related").get(getRelatedVideos);

export default router;
