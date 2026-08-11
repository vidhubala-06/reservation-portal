import cloudinary from "../config/cloudinary.js";

// Upload an in-memory image buffer, return its hosted URL
export const uploadToCloudinary = (buffer, folder = "turf_photos") =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) reject(error);
      else resolve(result.secure_url);
    });
    stream.end(buffer);
  });