import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}`, {
      dbName: 'videotube',
    });
  } catch (error) {
    console.error('MONGODB connection error : ', error);
    process.exit(1);
  }
};
mongoose.connection.on('connected', () => {
  console.log('MONGODB CONNECTED SUCCESSFULLY');
});

mongoose.connection.on('error', (error) => {
  console.error('DATABASE ERROR:: ', error);
});
export default connectDB;
