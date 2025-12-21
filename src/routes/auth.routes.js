import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
} from "../controllers/auth.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { Router } from "express";
import {
  loginValidator,
  signUpValidator,
} from "../validators/user.validators.js";

const authRouter = Router();

authRouter.route("/register").post(signUpValidator, registerUser);
authRouter.route("/login").post(loginValidator, loginUser);
authRouter.route("/refreshAccessToken").post(refreshAccessToken);
authRouter.route("/logout").post(verifyJwt, logoutUser);
export { authRouter };
