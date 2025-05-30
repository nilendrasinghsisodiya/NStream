import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import helmet from "helmet";
import fs from "fs";
import https from "https";
import { __dirname } from "./fileUtils.js";

const app = express();
// const key = fs.readFileSync(
//   path.join(__dirname, "../ssl/nstream.backend-key.pem")
// );
// const cert = fs.readFileSync(
//   path.join(__dirname, "../ssl/nstream.backend.pem")
// );

app.use(helmet());
// leaving at * because of issue in development because of self signed certs
app.use(
  cors({
   origin: 'http://localhost:5173', // ✅ Specific origin, NOT '*'
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization','optional'],
  })
);


app.use(
  express.json({
    limit: "16kb",
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  })
);
app.use(cookieParser());
app.use(express.static("public"));

// routes import
import userRouter from "./routes/user.routes.js";
import likeRouter from "./routes/like.routes.js";
import videoRouter from "./routes/video.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import commentRouter from "./routes/comment.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import healthcheckRouter from "./routes/healthCheck.routes.js";

// routes declaration

app.use("/api/v1/user", userRouter);

app.use("/api/v1/like/", likeRouter);

app.use("/api/v1/video", videoRouter);

app.use("/api/v1/playlist", playlistRouter);

app.use("/api/v1/comment", commentRouter);

app.use("/api/v1/dashboard", dashboardRouter);
app.use("/healthCheck", healthcheckRouter);

app.use("/api/v1/tweet", tweetRouter);
app.get("/check", (req, res) => {
  res.send("hello world");
});
app.use(express.static(path.join(__dirname, "dist")));

app.use((err, req, res, next) => {
  console.error(err.stack); // Log error to console

  res.status(err.statusCode || 500).json({
    success: false,
    status: err.statusCode,
    message: err.message || "Internal Server Error",
  });
});
// app.get("*",(req,res)=>{
//     res.sendFile(path.join(__dirname,  "dist", "index.html"))
// })

export { app };
