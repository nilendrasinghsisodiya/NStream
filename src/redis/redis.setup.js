// At the very top of each file that runs in its own process
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve("test.env") });


import { Redis } from "@upstash/redis";
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export { redis };
