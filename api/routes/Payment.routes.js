const express = require("express");
const paymentRouter = express.Router();
const {
  createPayment,
  handleWebhook,
  getPaymentStatus,
  getUserCredits,
} = require("../controllers/Payment.controller");
const passport = require("passport");
const { body, param } = require("express-validator");

// Get user credits
paymentRouter.get(
  "/credits",
  passport.authenticate("jwt", { session: false }),
  getUserCredits
);

// Create payment
paymentRouter.post(
  "/create",
  passport.authenticate("jwt", { session: false }),
  [
    body("packageId")
      .notEmpty()
      .withMessage("Package ID is required")
      .isMongoId()
      .withMessage("Invalid package ID"),
    body("discountCode")
      .optional()
      .isLength({ min: 3, max: 20 })
      .withMessage("Discount code must be between 3 and 20 characters")
      .matches(/^[A-Z0-9]+$/)
      .withMessage(
        "Discount code must contain only uppercase letters and numbers"
      ),
  ],
  createPayment
);

// Get payment status
paymentRouter.get(
  "/status/:orderId",
  passport.authenticate("jwt", { session: false }),
  [param("orderId").notEmpty().withMessage("Order ID is required")],
  getPaymentStatus
);

// Webhook endpoint (no authentication required)
paymentRouter.post(
  "/webhook",
  express.urlencoded({ extended: true }),
  handleWebhook
);

module.exports = paymentRouter;
