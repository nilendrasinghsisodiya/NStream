console.log(process.env.NODE_ENV);
console.log(process.env.CLIENT);
import connectDB from './db/connectDB.js';
import { app } from './app.js';
import { initRedis } from './redis/redis.setup.js';
import { initOtpWorker } from './worker/otp.worker.js';
import { initOtpQueue } from './messageQueue/bullmq.setup.js';
const init = async () => {
  try {
    await connectDB();
    console.log('DB CONNECTED SUCCESSFULLY');
  } catch (err) {
    console.error('DB CONNECTION:: failed', err.message);

    return;
  }

  try {
    await initRedis();
    console.log('REDIS CONNECTED SUCCESSFULLY');
  } catch (err) {
    console.error('REDIS INIT FAILED:: ', err.message);
  }

  try {
    await initOtpQueue();
    console.log('OTP QUEUE INIT SUCCESSFULLY');
  } catch (err) {
    console.error('OTP QUEUE INIT FAILED:: ', err.message);
  }

  try {
    await initOtpWorker();
    console.log('OTP WORKER INIT SUCCESSFULLY');
  } catch (err) {
    console.error('OTP WORKER INIT FAILED:: ', err.message);
  }
  app.on('error', (error) => {
    console.error('APPLICATION ERROR ::', error);
    throw error;
  });

  app.listen(process.env.PORT, () => {
    console.log(`SERVER LISTENING ON PORT: ${process.env.PORT}`);
  });
};

try {
  init();
} catch (error) {
  console.error(error);
  throw error;
}
