// src/lib/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';

if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  console.warn('Cloudinary env vars missing. Image uploads will fail.');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file buffer to Cloudinary
 * @param {Buffer} buffer - File buffer
 * @param {string} filename - Original filename (used to get extension)
 * @param {string} folder - Cloudinary folder to upload into
 * @returns {Promise<string>} - Secure URL of the uploaded image
 */
export async function uploadToCloudinary(buffer, filename, folder = 'streakify/proofs') {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: `proof_${Date.now()}`,
        resource_type: 'image',
        transformation: [
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
          { width: 1200, height: 1200, crop: 'limit' }, // cap max size
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
}
