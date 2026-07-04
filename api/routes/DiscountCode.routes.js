const express = require("express");
const discountCodeRouter = express.Router();
const {
  createDiscountCode,
  getDiscountCodes,
  validateDiscountCode,
  updateDiscountCode,
  deleteDiscountCode,
} = require("../controllers/DiscountCode.controller");
const passport = require("passport");
const checkAdmin = require("../../middleware/CheckAdmin");
const { body, param } = require("express-validator");

// Create discount code (Admin only)
discountCodeRouter.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  checkAdmin,
  [
    body("code")
      .notEmpty()
      .withMessage("Code is required")
      .isLength({ min: 3, max: 20 })
      .withMessage("Code must be between 3 and 20 characters"),
    body("discountType")
      .isIn(["percentage", "fixed", "free_credits"])
      .withMessage(
        "Discount type must be 'percentage', 'fixed', or 'free_credits'"
      ),
    body("discountValue")
      .isNumeric()
      .withMessage("Discount value must be a number")
      .custom((value, { req }) => {
        if (
          req.body.discountType === "percentage" &&
          (value < 0 || value > 100)
        ) {
          throw new Error("Percentage discount must be between 0 and 100");
        }
        if (req.body.discountType === "fixed" && value < 0) {
          throw new Error("Fixed discount must be positive");
        }
        return true;
      }),
    body("maxUses")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Max uses must be a positive integer"),
    body("validUntil")
      .isISO8601()
      .withMessage("Valid until must be a valid date")
      .custom((value) => {
        if (new Date(value) <= new Date()) {
          throw new Error("Valid until must be in the future");
        }
        return true;
      }),
    body("description")
      .optional()
      .isLength({ max: 200 })
      .withMessage("Description must be less than 200 characters"),
  ],
  createDiscountCode
);

// Get all discount codes (Admin only)
discountCodeRouter.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  checkAdmin,
  getDiscountCodes
);

// Validate discount code (Authenticated users only)
discountCodeRouter.get(
  "/validate/:code",
  passport.authenticate("jwt", { session: false }),
  [
    param("code")
      .notEmpty()
      .withMessage("Code is required")
      .isLength({ min: 3, max: 20 })
      .withMessage("Code must be between 3 and 20 characters"),
  ],
  validateDiscountCode
);

// Update discount code (Admin only)
discountCodeRouter.put(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  checkAdmin,
  [
    param("id").isMongoId().withMessage("Invalid discount code ID"),
    body("code")
      .optional()
      .isLength({ min: 3, max: 20 })
      .withMessage("Code must be between 3 and 20 characters"),
    body("discountType")
      .optional()
      .isIn(["percentage", "fixed", "free_credits"])
      .withMessage(
        "Discount type must be 'percentage', 'fixed', or 'free_credits'"
      ),
    body("discountValue")
      .optional()
      .isNumeric()
      .withMessage("Discount value must be a number"),
    body("maxUses")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Max uses must be a positive integer"),
    body("validUntil")
      .optional()
      .isISO8601()
      .withMessage("Valid until must be a valid date"),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("Is active must be a boolean"),
    body("description")
      .optional()
      .isLength({ max: 200 })
      .withMessage("Description must be less than 200 characters"),
  ],
  updateDiscountCode
);

// Delete discount code (Admin only)
discountCodeRouter.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  checkAdmin,
  [param("id").isMongoId().withMessage("Invalid discount code ID")],
  deleteDiscountCode
);

module.exports = discountCodeRouter;
