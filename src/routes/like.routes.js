import {Router} from "express"
import {verifyJwt} from "../middlewares/auth.middleware.js"
import {toggleVideoLike,toggleCommentLike} from "../controllers/like.controller.js"

const router = Router();

router.route("/video").post(verifyJwt,toggleVideoLike);
router.route("/comment").post(verifyJwt,toggleCommentLike);


export default router;