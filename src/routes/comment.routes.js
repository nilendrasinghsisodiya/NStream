import { Router } from 'express';
import { verifyJwt } from '../middlewares/auth.middleware.js';
import {
  addComment,
  deleteComment,
  updateComment,
  getReplies,
  addReply,
} from '../controllers/comment.controller.js';
import { requireBody } from '../middlewares/requireBody.middleware.js';
const commentRouter = Router();

commentRouter
  .route('/')
  .post(requireBody, verifyJwt, addComment)
  .delete(verifyJwt, deleteComment)
  .patch(requireBody, verifyJwt, updateComment);

commentRouter.route('/reply').post(requireBody, verifyJwt, addReply).get(verifyJwt, getReplies);

export { commentRouter };
