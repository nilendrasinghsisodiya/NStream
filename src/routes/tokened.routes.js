import {
  deleteUser,
  requestAccoutDeletion,
  verifyEmail,
} from '../controllers/tokened.controller.js';
import { Router } from 'express';
import { verifyJwt } from '../middlewares/auth.middleware.js';
import { verify as verifyTokens } from '../middlewares/verification.middleware.js';

const tokenedRouter = Router();
tokenedRouter.route('/request-delete').post(verifyJwt, requestAccoutDeletion);
tokenedRouter.route('/verify-email').post(verifyTokens, verifyEmail);
tokenedRouter.route('/delete-user').post(verifyTokens, deleteUser);

export { tokenedRouter };
