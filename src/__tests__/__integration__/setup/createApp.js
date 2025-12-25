import express from 'express';
import cookieParser from 'cookie-parser';
import { userRouter } from '../../../routes/user.routes.js';
import { authRouter } from '../../../routes/auth.routes.js';
import helmet from 'helmet';
import { likeRouter } from '../../../routes/like.routes.js';
import { playlistRouter } from '../../../routes/playlist.routes.js';
import { commentRouter } from '../../../routes/comment.routes.js';
import { verifyRouter } from '../../../routes/verification.ruotes.js';
import { videoRouter } from '../../../routes/video.routes.js';
import { dashboardRouter } from '../../../routes/dashboard.routes.js';

export const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(helmet());

  app.use(cookieParser());
  app.use('/user', userRouter);
  app.use('/auth', authRouter);
  app.use('/video', videoRouter);
  app.use('/comment', commentRouter);
  app.use('/verify', verifyRouter);
  app.use('/playlist', playlistRouter);
  app.use('/like', likeRouter);
  app.use('/dashbaord', dashboardRouter);

  app.use((err, req, res, next) => {
    console.error(err); // Log error to console

    res.status(err.statusCode || 500).json({
      success: false,
      status: err.statusCode,
      message: err.message || 'Internal Server Error',
    });
  });

  return app;
};
