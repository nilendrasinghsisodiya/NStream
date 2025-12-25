import { startMongo, stopMongo } from './mongo-setup.js';

export default async function () {
  await startMongo();

  return async () => {
    await stopMongo();
  };
}
