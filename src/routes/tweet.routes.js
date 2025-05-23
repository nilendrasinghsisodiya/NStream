import { createTweet, deleteTweet, updateTweet } from "../controllers/tweet.controller.js";
import {Router} from "express"
import {verifyJwt} from "../middlewares/auth.middleware.js"

const router = Router();


router.route("/").post(verifyJwt,createTweet)
router.route("/").patch(verifyJwt,updateTweet)
router.route("/").delete(verifyJwt,deleteTweet);


export default router;