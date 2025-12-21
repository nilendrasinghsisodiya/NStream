import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistById,
  removeVideoFromPlaylist,
  updatePlaylist,
} from "../controllers/playlist.controller.js";
import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const playlistRouter = Router();

playlistRouter.route("/createPlaylist").post(verifyJwt, createPlaylist);
playlistRouter.route("/updatePlaylist").patch(verifyJwt, updatePlaylist);
playlistRouter.route("/addVideos").patch(verifyJwt, addVideoToPlaylist);
playlistRouter.route("/delete").delete(verifyJwt, deletePlaylist);
playlistRouter.route("/removeVideos").patch(verifyJwt, removeVideoFromPlaylist);
playlistRouter.route("/").get(getPlaylistById);

export { playlistRouter };

