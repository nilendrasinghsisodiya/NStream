import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
   
   
    console.log(process.env.MONGODB_URI);
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}`,{dbName:"videotube"}
    );
    console.log(
      `/n MongoDB connected !! Db host: ${connectionInstance.host}, DB NAME: ${connectionInstance.name}` );
  } catch (error) {
    console.log("MONGODB connection error : ", error);
    process.exit(1);
  }
};

export default connectDB
