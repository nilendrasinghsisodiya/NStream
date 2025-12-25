import dotenv from 'dotenv';
import path from 'path';
import { __dirname } from './utils/fileUtils.js';
//import { updateManyFieldsInDoc } from './utils/additionalUtils.js'; // only for dev

const env_file_path = path.resolve(__dirname, '../.env');
console.log(env_file_path);
dotenv.config({ path: env_file_path });
import connectDB from './db/connectDB.js';
import { app } from './app.js';
import { initRedis } from './redis/redis.setup.js';
import { initOtpWorker } from './worker/otp.worker.js';
const init = async () => {
  try {
    await connectDB();
  } catch (err) {
    console.error('DB CONNECTION:: failed', err.message);

    return;
  }

  try {
    await initRedis();
  } catch (err) {
    console.error('REDIS INIT FAILED:: ', err.message);
  }

  try {
    await initOtpWorker();
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
