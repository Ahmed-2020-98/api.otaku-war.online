const { S3Client } = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3");
require("dotenv").config();

const MAX_FILE_SIZE = 1024 * 1024 * 100; // 100MB
const { ALLOWED_TYPES } = require("./config");

const s3Client = new S3Client({
  endpoint: process.env.SPACE_ENDPOINT,
  region: "us-east-1", // or your preferred region
  credentials: {
    accessKeyId: process.env.SPACE_ACCESS_KEY,
    secretAccessKey: process.env.SPACE_SECRET_KEY,
  },
});

const uploadS3 = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.SPACE_NAME,
    acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix + "-" + file.originalname);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix + "-" + file.originalname);
    },
    onError: function (err, req, res, next) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ message: "File size too large" });
      } else if (err.code === "INVALID_FILE_TYPE") {
        return res.status(415).json({ message: "Invalid file type" });
      } else if (err.code === "FILE_TOO_LARGE") {
        console.log(err);
        return res.status(413).json({ message: "File size too large" });
      } else {
        next(err);
      }
    },
  }),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    const fileType = file.mimetype;
    if (ALLOWED_TYPES.includes(fileType)) {
      cb(null, true);
    } else {
      const error = new Error("Invalid file type");
      error.code = "INVALID_FILE_TYPE";
      cb(error);
    }
  },
});

module.exports = uploadS3;
