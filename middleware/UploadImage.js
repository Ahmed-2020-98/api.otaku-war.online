const { upload } = require("./cloudinary");
const { ALLOWED_TYPES } = require("./config");

const uploadImage = upload.fields([
  { name: "media", maxCount: 1 },
  { name: "answerMedia", maxCount: 1 },
  { name: "logo", maxCount: 1 },
]);

function uploadImageMiddleware(req, res, next) {
  uploadImage(req, res, function (err) {
    if (err) {
      console.log("Error details:", {
        code: err.code,
        message: err.message,
        fullError: err,
      });

      // Handle different error types
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          message: "File size too large. Max size is 100MB",
        });
      } else if (err.code === "INVALID_FILE_TYPE") {
        return res.status(415).json({
          message: "Invalid file type",
          allowedTypes: ALLOWED_TYPES,
        });
      } else {
        return res.status(400).json({
          message: "Upload error",
          error: err.message,
        });
      }
    }
    next();
  });
}

module.exports = uploadImageMiddleware;
