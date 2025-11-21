// At the very top of each file that runs in its own process
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve("test.env") });


import { Queue } from "bullmq";
import { redis } from "../redis/redis.setup.js";

export const otpQueue = new Queue("otpQueue", { connection: redis });

