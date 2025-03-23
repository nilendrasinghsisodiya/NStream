import dotenv from "dotenv";
import connectDB from "./db/connectDB.js";
import { app } from "./app.js";

dotenv.config({path:"./env"})

console.log(process.env.CLOUNDINARY_API_KEY);


connectDB()
.then(()=>{
  try{
   app.on("error",(error)=>{
    console.log("Application ERROR : ", error)
    throw error
   })
  

  app.listen(process.env.PORT || 8000, ()=>{
    console.log(`Sever listening on port: ${process.env.PORT}`)

  })
}catch(error){
  console.log(error)
  throw  error

} }

)
.catch((err)=>{
  console.log("MONGODB connection failed !!!");
})












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