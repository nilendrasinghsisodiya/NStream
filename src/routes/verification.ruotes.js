import {
  verifyOtpDelete,
  verifyOtpSignUp,
  verifyOtpForgetPassword,
  getOtpDelete,
  getOtpSignUp,
  getOtpForgetPassword,
} from "../controllers/verifications.controller.js";
import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const verifyRouter = Router();
verifyRouter.route("verifyOtpDelete").post(verifyJwt, verifyOtpDelete);
verifyRouter.route("getOtpDelete").get(verifyJwt, getOtpDelete);
verifyRouter.route("verifyOtpSignUp").post(verifyJwt, verifyOtpSignUp);
verifyRouter.route("getOptSignUp").get(verifyJwt, getOtpSignUp);
verifyRouter.route("verifyOtpFp").post(verifyJwt, verifyOtpForgetPassword);
verifyRouter.route("getOtpFp").get(verifyJwt, getOtpForgetPassword);

export { verifyRouter };
