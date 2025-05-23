import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

// cloudinary Configuration
cloudinary.config({
  secure:true,
  cloud_name: process.env.CLOUNDINARY_CLOUD_NAME,
  api_key: process.env.CLOUNDINARY_API_KEY,
  api_secret: process.env.CLOUNDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async (filePath, publicId) => {
  try {
    console.log(filePath);

    if (!filePath) return null;

    let response = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
      public_id: publicId,
      folder:floderName
    });
    console.log("file upoladed successfully", response.url);
    fs.unlinkSync(filePath);
    return response;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Error removing file:", err);
      }
    });
    return null;
  }
};

const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("cloudinary destroy result : ", result);
    return result;
  } catch (error) {
    console.error("Error while  delete deleting the files from  cloud", error.message);
  }
};

export { uploadOnCloudinary ,deleteFromCloudinary};
