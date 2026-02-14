import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistById,
  removeVideoFromPlaylist,
  updatePlaylist,
} from '../controllers/playlist.controller.js';
import { Router } from 'express';
import { verifyJwt } from '../middlewares/auth.middleware.js';
import { requireBody } from '../middlewares/requireBody.middleware.js';
const playlistRouter = Router();

playlistRouter.route('/create-playlist').post(verifyJwt, requireBody, createPlaylist);
playlistRouter.route('/update-playlist').patch(verifyJwt, requireBody, updatePlaylist);
playlistRouter.route('/add-videos').patch(verifyJwt, requireBody, addVideoToPlaylist);
playlistRouter.route('/delete').delete(verifyJwt, requireBody, deletePlaylist);
playlistRouter.route('/remove-videos').patch(verifyJwt, requireBody, removeVideoFromPlaylist);
playlistRouter.route('/').get(getPlaylistById);

export { playlistRouter };
