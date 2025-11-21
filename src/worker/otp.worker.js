// At the very top of each file that runs in its own process
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve("test.env") });


import { Worker } from "bullmq";
import { redis } from "../redis/redis.setup.js";
import nodemailer from "nodemailer";
console.log("type","OAUTH2",
    "user", process.env.APP_MAIL,
    "clientId", process.env.GOOGLE_CLIENT_ID,
    "clientSecret", process.env.GOOGLE_CLIENT_SECRET,
    "refreshToken", process.env.GOOGLE_REFRESH_TOKEN,
  )
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type:"OAUTH2",
    user: process.env.APP_MAIL,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  },
});

const sendmail = async (email, otp) => {
  try {
    console.log("in sendmail");
    const info = await transporter.sendMail({
      from: process.env.APP_MAIL,
      to: email,
      subject: "OTP Verification For NStream",
      text: `Your otp is : ${otp}`,
    });
    console.log("otp sent", info.messageId);
  } catch (error) {
    console.error(error.message);
  }
};

const otpWorker = new Worker(
  "otpQueue",
  async (job) => {
    try {
      const { usermail, otp } = job.data;
      console.log(usermail, otp);
      await sendmail(usermail, otp);

      console.log("userId", usermail, "otp", otp);
    } catch (error) {
      console.log(error.message);
    }
  },
  {
    connection: redis,
    removeOnComplete: {
      age: 300,
      count: 0,
    },
    removeOnFail: {
      count: 100,
    },

    autorun:false,
    concurrency: 50,
  }
);
otpWorker.on("connection", () => {
  console.log("worker has connected sucessfully");
});
otpWorker.on("drained", () => {
  console.log("all jobs have been completed");
});

otpWorker.on("failed", (job) => {
  console.log(
    `Error:: failed to compelete \n jobId: ${job.id} \t jobData: ${job.data} \n`
  );
});

export { otpWorker };
