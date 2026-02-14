import { getOtp, verifyOtp } from '../controllers/verifications.controller.js';
import { Router } from 'express';
import { requireBody } from '../middlewares/requireBody.middleware.js';
const verifyRouter = Router();

verifyRouter.route('/get-otp').post(requireBody, getOtp);
verifyRouter.route('/verify-otp').post(requireBody, verifyOtp);
export { verifyRouter };
