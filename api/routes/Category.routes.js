const express = require("express");
const categoryRouter = express.Router();
const {
  createCategory,
  getAllCategories,
  updateCategory,
  lockCategory,
  getCategoryById,
  deleteCategory,
  restoreCategory,
  getDeletedCategories,
} = require("../controllers/Category.controller");
const passport = require("passport");
const { param, body } = require("express-validator");
const upload = require("../../middleware/multer");
const checkAdmin = require("../../middleware/CheckAdmin");
const uploadImageMiddleware = require("../../middleware/UploadImage");

categoryRouter.post(
  "/",
  uploadImageMiddleware,
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("description").notEmpty().withMessage("Description is required"),
    // body("image").optional(),
  ],
  passport.authenticate("jwt", { session: false }),
  checkAdmin,
  createCategory
);

categoryRouter.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  // checkAdmin,
  getAllCategories
);

categoryRouter.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid Input")],
  getCategoryById
);

categoryRouter.put(
  "/:id",
  uploadImageMiddleware,
  [
    param("id").isMongoId().withMessage("Invalid Input"),
    body("name").notEmpty().withMessage("Name is required"),
    // body("image").notEmpty().withMessage("Image is required"),
    body("description").notEmpty().withMessage("Description is required"),
  ],
  passport.authenticate("jwt", { session: false }),
  checkAdmin,
  updateCategory
);

categoryRouter.put(
  "/lock/:id",
  [
    param("id").isMongoId().withMessage("Invalid Input"),
    body("locked").isBoolean().withMessage("Invalid Input"),
  ],
  passport.authenticate("jwt", { session: false }),
  checkAdmin,
  lockCategory
);

categoryRouter.delete(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid Input")],
  passport.authenticate("jwt", { session: false }),
  checkAdmin,
  deleteCategory
);

categoryRouter.put(
  "/restore/:id",
  [param("id").isMongoId().withMessage("Invalid Input")],
  passport.authenticate("jwt", { session: false }),
  checkAdmin,
  restoreCategory
);

categoryRouter.get(
  "/deleted/all",
  passport.authenticate("jwt", { session: false }),
  checkAdmin,
  getDeletedCategories
);

module.exports = categoryRouter;
