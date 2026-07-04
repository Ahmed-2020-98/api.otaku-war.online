const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { ALLOWED_TYPES } = require("./config");
require("dotenv").config();

const MAX_FILE_SIZE = 1024 * 1024 * 100; // 100MB

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memory storage - files stored as buffer
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error("Invalid file type");
      error.code = "INVALID_FILE_TYPE";
      cb(error);
    }
  },
});

// Helper to upload buffer to Cloudinary
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "auto", folder: "otaku-war", ...options },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
};

module.exports = { upload, uploadToCloudinary, cloudinary };
