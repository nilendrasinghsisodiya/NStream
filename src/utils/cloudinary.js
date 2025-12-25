import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// cloudinary Configuration
cloudinary.config({
  secure: true,
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (filePath, folderName) => {
  try {
    console.log(filePath);

    if (!filePath) return null;

    let response = await cloudinary.uploader.upload(filePath, {
      resource_type: 'auto',
      folder: folderName,
    });
    console.log('file upoladed successfully', response.url);
    fs.unlinkSync(filePath);
    return response;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Error removing file:', err);
      }
    });
    return null;
  }
};

const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('cloudinary destroy result : ', result);
    return result;
  } catch (error) {
    console.error(
      `Error while  delete deleting the files from  cloud for ${publicId}`,
      error.message,
    );
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
