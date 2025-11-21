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

const router = Router();
router.route("verifyOtpDelete").post(verifyJwt, verifyOtpDelete);
router.route("getOtpDelete").get(verifyJwt, getOtpDelete);
router.route("verifyOtpSignUp").post(verifyJwt, verifyOtpSignUp);
router.route("getOptSignUp").get(verifyJwt, getOtpSignUp);
router.route("verifyOtpFp").post(verifyJwt, verifyOtpForgetPassword);
router.route("getOtpFp").get(verifyJwt, getOtpForgetPassword);

export default router;
