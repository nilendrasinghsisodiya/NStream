import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  getChannelStats,
  getChannelVideos,
} from "../controllers/dashboard.controller.js";

const dashboardRouter = Router();
dashboardRouter.route("/videos").get(getChannelVideos);
dashboardRouter.route("/stats").get(verifyJwt, getChannelStats);

export { dashboardRouter };

