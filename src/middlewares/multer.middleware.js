import multer from "multer"
import path from "path"
 // multer give two options disk storage and memory (ram) storage we should avoid memory storage without limits

const storage = multer.diskStorage({
    // sets where file is saved
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    // set filename unique filename
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname) )
    }
  })
  

  // set options to multer and export it
   export const upload = multer({ 
    storage: storage
 })



