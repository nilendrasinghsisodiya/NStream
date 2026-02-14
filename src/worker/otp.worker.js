// At the very top of each file that runs in its own process

import { Worker } from 'bullmq';
import { getRedis } from '../redis/redis.setup.js';
import { otpMailTemplate, actionEmailTemplate, sendMail } from '../utils/mailUtils.js';

const initOtpWorker = async () => {
  const redis = await getRedis();

  const otpWorker = new Worker(
    'otpQueue',
    async (job) => {
      try {
        switch (job.name) {
          case 'otp': {
            const otpJobData = job.data;
            await sendMail(
              otpMailTemplate({ to: otpJobData.usermail, otp: otpJobData.otp, expiryMinutes: 10 }),
            );
            break;
          }
          case 'otToken': {
            const tokenJobData = job.data;
            if (!['verifyEmail', 'delete'].includes(tokenJobData.action)) {
              throw new Error(`Unknow token action: ${tokenJobData.action}`);
            }
            await sendMail(
              actionEmailTemplate({
                to: tokenJobData.usermail,
                userName: tokenJobData.username,
                actionName: tokenJobData.action,
                expiryMinutes: 60 * 30,
                actionLink: `${process.env.DOMAIN}/action=${tokenJobData.action}&otToken?token=${tokenJobData.token}`,
              }),
            );
            break;
          }
          default: {
            throw new Error(`Unkown job: ${job.name}`);
          }
        }
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

      autorun: false,
      concurrency: 50,
    },
  );
  otpWorker.on('connection', () => {
    console.log('worker has connected sucessfully');
  });
  otpWorker.on('drained', () => {
    console.log('all jobs have been completed');
  });

  otpWorker.on('failed', (job) => {
    console.log(`Error:: failed to compelete \n jobId: ${job.id} \t jobData: ${job.data} \n`);
  });

  return otpWorker;
};

export { initOtpWorker };
