const express = require("express");
const creditPackageRouter = express.Router();
const {
  createCreditPackage,
  getCreditPackages,
  updateCreditPackage,
  deleteCreditPackage,
  getUserCredits,
} = require("../controllers/CreditPackage.controller");
const passport = require("passport");
const checkAdmin = require("../../middleware/CheckAdmin");
const { body } = require("express-validator");
creditPackageRouter.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  checkAdmin,
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("price").notEmpty().withMessage("Price is required"),
    body("currency").notEmpty().withMessage("Currency is required"),
    body("isActive").notEmpty().withMessage("Is Active is required"),
    body("credits").notEmpty().withMessage("Credits is required"),
  ],
  createCreditPackage
);
creditPackageRouter.get("/", getCreditPackages);
creditPackageRouter.put(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  checkAdmin,
  [
    body("name").optional().notEmpty().withMessage("Name cannot be empty"),
    body("description")
      .optional()
      .notEmpty()
      .withMessage("Description cannot be empty"),
    body("price").optional().isNumeric().withMessage("Price must be a number"),
    body("currency")
      .optional()
      .notEmpty()
      .withMessage("Currency cannot be empty"),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("Is Active must be a boolean"),
    body("discount")
      .optional()
      .isNumeric()
      .withMessage("Discount must be a number"),
  ],
  updateCreditPackage
);
creditPackageRouter.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  checkAdmin,
  deleteCreditPackage
);

creditPackageRouter.get(
  "/credits",
  passport.authenticate("jwt", { session: false }),
  getUserCredits
);

module.exports = creditPackageRouter;
