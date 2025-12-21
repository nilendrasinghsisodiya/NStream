import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  addComment,
  deleteComment,
  updateComment,
  getReplies,
  addReply,
} from "../controllers/comment.controller.js";

const commentRouter = Router();

commentRouter
  .route("/")
  .post(verifyJwt, addComment)
  .delete(verifyJwt, deleteComment)
  .patch(verifyJwt, updateComment);

commentRouter
  .route("/reply")
  .post(verifyJwt, addReply)
  .get(verifyJwt, getReplies);

export { commentRouter };
