import dotenv from "dotenv";
import path from "path";
import { __dirname } from "./fileUtils.js";
import { updateManyFieldsInDoc } from "./utils/additionalUtils.js";

const env_file_path = path.resolve(__dirname, ".env");

console.log(env_file_path);
dotenv.config({ path: env_file_path });
import connectDB from "./db/connectDB.js";
import { app } from "./app.js";
import { Video } from "./models/video.model.js";
import { User } from "./models/user.model.js";
import { deleteFromCloudinary } from "./utils/cloudinary.js";
import { otpQueue } from "./messageQueue/bullmq.setup.js";

connectDB()
  .then(() => {
    try {
      app.on("error", (error) => {
        console.log("Application ERROR : ", error);
        throw error;
      });
      // remove after done one time use

      app.listen(process.env.PORT || 8000, () => {
        console.log(`Sever listening on port: ${process.env.PORT}`);

        // (async () => {
        //   User.find({ coverImagePublicId: { $nin: [null, ""] } }).then(
        //     (users) => {
        //       console.log("users that have a cover images", users);
        //       const usersPlain = users.map((u) => u.toObject());

        //       usersPlain.forEach((u) => {
        //         console.log(u.coverImagePublicId);
        //         deleteFromCloudinary(u.coverImagePublicId).then(() =>
        //           console.log("cover Image deleted form user ", u.username)
        //         );
        //       });
        //     }
        //   );
        // })();
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  })
  .catch((err) => {
    console.log("MONGODB connection failed !!!");
  });

// updateManyFieldsInDoc(Video,{},{$set:{deleted:false}});
otpQueue.add("opt",{useremail:"okashishow@gmail",otp:123456});
/*(async ()=>{
    try {
      await  mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
      app.on("error",(error)=>{
        console.log("ERROR: ", error)
        throw error
      });
      app.listen(process.env.PORT, ()=>{
        console.log(`app is listening on port ${process.env.PORT}`)
      })

      
    } catch (error) {
        console.error("ERROR: ",error)
        throw error
    }
})();

APPROCH 1 
*/
