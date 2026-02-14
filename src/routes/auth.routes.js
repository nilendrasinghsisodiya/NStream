import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
} from '../controllers/auth.controller.js';
import { verifyJwt } from '../middlewares/auth.middleware.js';
import { Router } from 'express';
import { loginValidator, signUpValidator } from '../validators/user.validators.js';
import { requireBody } from '../middlewares/requireBody.middleware.js';
import { resetPassword } from '../controllers/otpVerified.controller.js';
const authRouter = Router();

authRouter.route('/register').post(requireBody, signUpValidator, registerUser);
authRouter.route('/login').post(requireBody, loginValidator, loginUser);
authRouter.route('/refresh-access-token').post(refreshAccessToken);
authRouter.route('/logout').post(verifyJwt, logoutUser);
authRouter.route('/reset-password').post(requireBody, resetPassword);
export { authRouter };
