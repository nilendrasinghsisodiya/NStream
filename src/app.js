import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));



const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
    
}));

app.use(express.json({
    limit: "16kb"
}))
app.use(express.urlencoded({
    extended:true,
    limit: "16kb"
}));
app.use(express.static("public"));
app.use(cookieParser())




// routes import
import userRouter from "./routes/user.routes.js"
import likeRouter from "./routes/like.routes.js"
import videoRouter from "./routes/video.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import healthcheckRouter from "./routes/healthcheck.routes.js"
import commentRouter from "./routes/comment.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"


// routes declaration

app.use("/api/v1/users",userRouter)

app.use("/api/v1/like/:videoID",likeRouter);


app.use("/api/v1/videos", videoRouter)

app.use("/api/v1/playlist",playlistRouter)

app.use("/api/v1/comment",commentRouter)

app.use("/api/v1/dashboard",dashboardRouter)

app.use("/api/v1/healthcheck",healthcheckRouter)

app.use("/api/v1/tweet",tweetRouter)
app.use(express.static(path.join(__dirname,"dist")));
app.get("*",(req,res)=>{
    res.sendFile(path.join(__dirname,  "dist", "index.html"))
})


export {app}