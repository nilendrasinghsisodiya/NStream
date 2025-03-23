import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  addComment,
  deleteComment,
  updateComment,
  getReplies
} from "../controllers/comment.controller.js";
import { toggleCommentLike } from "../controllers/like.controller.js";

const router = Router();

router
  .route("/")
  .get(getReplies)
  .post(verifyJwt, addComment)
  .delete(verifyJwt, deleteComment)
  .patch(verifyJwt, updateComment);

export default router;
