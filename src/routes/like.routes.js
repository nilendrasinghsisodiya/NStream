import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  toggleVideoLike,
  toggleCommentLike,
} from "../controllers/like.controller.js";

const likeRouter = Router();

likeRouter.route("/video").post(verifyJwt, toggleVideoLike);
likeRouter.route("/comment").post(verifyJwt, toggleCommentLike);

export { likeRouter };

