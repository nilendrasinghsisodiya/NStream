import { MongoDBContainer } from '@testcontainers/mongodb';

let container;

export const startMongo = async () => {
  try {
    container = await new MongoDBContainer('mongo:7').start();

    const uri = `mongodb://127.0.0.1:${container.getMappedPort(27017)}/test`;

    process.env.mongoUri = uri;
    console.log('✅ MongoDB Testcontainer connected');
  } catch (err) {
    console.error('❌ Failed to start MongoDB container', err);
    throw err;
  }
};

export const stopMongo = async () => {
  try {
    process.mongoUri = 'disconnected';
    if (container) {
      await container.stop();
    }

    console.log('🛑 MongoDB Testcontainer stopped');
  } catch (err) {
    console.error('❌ Failed to stop MongoDB container', err);
  }
};
