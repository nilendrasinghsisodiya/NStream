import {Router} from "express"
import {verifyJwt} from "../middlewares/auth.middleware.js"
import {toggleVideoLike} from "../controllers/like.controller.js"

const router = Router();

router.route("/:videoId").post(verifyJwt,toggleVideoLike)


export default router;