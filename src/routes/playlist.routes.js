import { addVideoToPlaylist, createPlaylist, deletePlaylist, getPlaylistById, removeVideoFromPlaylist, updatePlaylist } from "../controllers/playlist.controller.js";
import {Router} from "express"
import {verifyJwt} from "../middlewares/auth.middleware.js"

const router = Router();

router.route("/createPlaylist").post(verifyJwt,createPlaylist);
router.route("/updatePlaylist").patch(verifyJwt,updatePlaylist);
router.route("/addVideos").patch(verifyJwt,addVideoToPlaylist);
router.route("/delete").delete(verifyJwt,deletePlaylist);
router.route("/removeVideos").patch(verifyJwt,removeVideoFromPlaylist);
router.route("/").get(getPlaylistById);


export default router;