import { Router } from 'express';
import { verifyJwt } from '../middlewares/auth.middleware.js';
import { toggleVideoLike, toggleCommentLike } from '../controllers/like.controller.js';
import { requireBody } from '../middlewares/requireBody.middleware.js';

const likeRouter = Router();

likeRouter.route('/video').post(requireBody, verifyJwt, toggleVideoLike);
likeRouter.route('/comment').post(requireBody, verifyJwt, toggleCommentLike);

export { likeRouter };
