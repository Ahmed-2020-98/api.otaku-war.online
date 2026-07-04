const multer = require("multer");

const MAX_FILE_SIZE = 1024 * 1024 * 100; // 100MB
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "media");
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
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "video/mp4",
      "audio/mpeg",
      "video/mp3",
      "image/gif",
      "image/webp",
      "image/jpg",
      "audio/mp3",
      "audio/mp4",
      "audio/mpeg",
      "audio/wav",
    ];

    console.log("file.mimetype", file.mimetype);
    if (allowedTypes.includes(file.mimetype)) {
      console.log(
        "allowedTypes.includes(file.mimetype)",
        allowedTypes.includes(file.mimetype)
      );
      cb(null, true);
    } else {
      const error = new Error("Invalid file type");
      error.code = "INVALID_FILE_TYPE";
      cb(error);
    }
  },
});

module.exports = upload;
