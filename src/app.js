import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

const app = express();

console.log('CLIENT ORIGIN =', process.env.CLIENT);

app.use(
  cors({
    credentials: true,
    origin: process.env.CLIENT,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'optional'],
  }),
);

app.use(helmet());
app.use(
  express.json({
    limit: '16kb',
  }),
);
app.use(
  express.urlencoded({
    extended: true,
    limit: '16kb',
  }),
);
app.use(cookieParser());
app.use(express.static('public'));

// routes import
import { userRouter } from './routes/user.routes.js';
import { likeRouter } from './routes/like.routes.js';
import { videoRouter } from './routes/video.routes.js';
import { commentRouter } from './routes/comment.routes.js';
import { dashboardRouter } from './routes/dashboard.routes.js';
import { hcRouter } from './routes/healthCheck.routes.js';
import { playlistRouter } from './routes/playlist.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { tokenedRouter } from './routes/tokened.routes.js';
// routes declaration

app.use('/api/v1/user', userRouter);

app.use('/api/v1/tokened', tokenedRouter);

app.use('/api/v1/auth', authRouter);

app.use('/api/v1/like/', likeRouter);

app.use('/api/v1/video', videoRouter);

app.use('/api/v1/playlist', playlistRouter);

app.use('/api/v1/comment', commentRouter);

app.use('/api/v1/dashboard', dashboardRouter);

app.use('/healthCheck', hcRouter);

app.get('/check', (req, res) => {
  res.send('hello world');
});

app.use((err, req, res, next) => {
  console.error(err); // Log error to console
  console.error('ERROR IN:', req.method, req.originalUrl);
  console.error(err.stack);
  return res.status(err.statusCode || 500).json({
    success: false,
    status: err.statusCode,
    message: err.message || 'Internal Server Error',
    ...err,
  });
});

export { app };
