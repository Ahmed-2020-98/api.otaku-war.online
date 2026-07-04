const { validationResult, matchedData } = require("express-validator");
const Payment = require("../../models/Payment");
const User = require("../../models/User");
const CreditPackage = require("../../models/CreditPackage");
const DiscountCode = require("../../models/DiscountCode");
const upaymentsService = require("../../utils/upaymentsService");
const { handleValidationErrors } = require("../../utils/validationUtils");
const crypto = require("crypto");
const mongoose = require("mongoose");
const { generateToken } = require("../../utils/mongoUtils");

const ERROR_MESSAGES = {
  INSUFFICIENT_CREDITS: "Insufficient credits to create game",
  PACKAGE_NOT_FOUND: "Credit package not found",
  INVALID_AMOUNT: "Invalid amount",
  PAYMENT_FAILED: "Payment creation failed",
  INVALID_DISCOUNT_CODE: "Invalid or expired discount code",
  DISCOUNT_CODE_USAGE_LIMIT: "Discount code usage limit reached",
};

// Helper function to calculate discount
const calculateDiscount = (originalPrice, discountCode) => {
  if (!discountCode) return { finalPrice: originalPrice, discountAmount: 0 };

  let discountAmount = 0;
  if (discountCode.discountType === "percentage") {
    discountAmount = (originalPrice * discountCode.discountValue) / 100;
  } else if (discountCode.discountType === "fixed") {
    discountAmount = Math.min(discountCode.discountValue, originalPrice);
  }

  const finalPrice = Math.max(0, originalPrice - discountAmount);
  return { finalPrice, discountAmount };
};

// Create payment for credits
const createPayment = async (req, res, next) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const { packageId, discountCode } = matchedData(req);
    const userId = req.user._id;

    // Get user and package details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const creditPackage = await CreditPackage.findById(packageId);

    if (!creditPackage || !creditPackage.isActive) {
      return res
        .status(404)
        .json({ message: ERROR_MESSAGES.PACKAGE_NOT_FOUND });
    }

    // Validate discount code if provided
    let discountCodeData = null;
    if (discountCode) {
      discountCodeData = await DiscountCode.findOne({
        code: discountCode.toUpperCase(),
        isActive: true,
      });

      if (!discountCodeData) {
        return res
          .status(400)
          .json({ message: ERROR_MESSAGES.INVALID_DISCOUNT_CODE });
      }

      // Check if code is still valid
      const now = new Date();
      if (
        now < discountCodeData.validFrom ||
        now > discountCodeData.validUntil
      ) {
        return res
          .status(400)
          .json({ message: ERROR_MESSAGES.INVALID_DISCOUNT_CODE });
      }

      // Check usage limits
      if (
        discountCodeData.maxUses &&
        discountCodeData.usedCount >= discountCodeData.maxUses
      ) {
        return res
          .status(400)
          .json({ message: ERROR_MESSAGES.DISCOUNT_CODE_USAGE_LIMIT });
      }
    }

    // Calculate final price with discount
    const originalPrice = creditPackage.price;
    const { finalPrice, discountAmount } = calculateDiscount(
      originalPrice,
      discountCodeData
    );

    // Generate shorter, UPayments-compliant order ID (max 35 characters)
    const timestamp = Date.now().toString(36);
    const randomSuffix = crypto.randomBytes(8).toString("hex");
    const orderId = `ORD_${timestamp}_${randomSuffix}`.substring(0, 35);

    // Build charge request with the exact UPayments structure
    const chargeData = upaymentsService.buildChargeRequest({
      orderId,
      packageName: `${creditPackage.credits} Games`,
      packageCredits: creditPackage.credits,
      amount: finalPrice,
      description: `Buying ${creditPackage.credits} credits to play ${
        creditPackage.credits
      } games${
        discountCodeData ? ` (Discount: ${discountCodeData.code})` : ""
      }`,
      returnUrl: `${process.env.FRONTEND_URL}/payment/success?orderId=${orderId}`,
      cancelUrl: `${process.env.FRONTEND_URL}/payment/cancel?orderId=${orderId}`,
      // Use environment variable for webhook URL
      notificationUrl: `${process.env.BACKEND_URL}/api/payments/webhook`,
      customerData: {
        userId: user._id.toString(),
        fullName: user.fullName || user.username,
        email: user.username,
      },
      language: "en",
      customerExtraData: `User ID: ${user._id}, Package: ${creditPackage.name}${
        discountCodeData ? `, Discount: ${discountCodeData.code}` : ""
      }`,
    });

    // Create payment record
    const payment = await Payment.create({
      userId,
      upaymentsOrderId: orderId,
      amount: finalPrice,
      originalAmount: originalPrice,
      discountAmount: discountAmount,
      discountCode: discountCodeData ? discountCodeData._id : null,
      credits: creditPackage.credits,
      currency: creditPackage.currency,
      returnUrl: chargeData.returnUrl,
      cancelUrl: chargeData.cancelUrl,
      notificationUrl: chargeData.notificationUrl,
    });

    // Create charge with UPayments
    const chargeResponse = await upaymentsService.createCharge(chargeData);

    if (chargeResponse.status && chargeResponse.data?.link) {
      return res.status(200).json({
        message: "Payment created successfully",
        paymentUrl: chargeResponse.data.link,
        orderId: orderId,
        originalAmount: originalPrice,
        discountAmount: discountAmount,
        finalAmount: finalPrice,
        discountCode: discountCodeData ? discountCodeData.code : null,
      });
    } else {
      throw new Error(ERROR_MESSAGES.PAYMENT_FAILED);
    }
  } catch (error) {
    next(error);
  }
};

// Handle payment webhook
const handleWebhook = async (req, res, next) => {
  try {
    const webhookData = req.body;

    // Extract data from UPayments webhook
    const {
      track_id,
      result,
      payment_id,
      auth,
      requested_order_id,
      ref,
      payment_type,
      transaction_date,
      receipt_id,
      invoice_id,
    } = webhookData;

    // Use requested_order_id to find the payment (this is your original order ID)
    const payment = await Payment.findOne({
      upaymentsOrderId: requested_order_id,
    }).populate("discountCode");

    if (!payment) {
      console.log(
        `Payment not found for requested_order_id: ${requested_order_id}`
      );
      return res.status(404).json({ message: "Payment not found" });
    }

    // Check if payment has already been processed
    if (payment.status === "completed") {
      console.log(`Payment already processed: ${requested_order_id}`);
      return res.status(200).json({ message: "Payment already processed" });
    }

    // Update payment status based on result field
    // UPayments uses 'CAPTURED' for successful payments
    const isSuccess = result === "CAPTURED";
    payment.status = isSuccess ? "completed" : "failed";
    payment.upaymentsTransactionId = payment_id;
    payment.upaymentsTrackId = track_id;
    payment.webhookData = webhookData;

    if (isSuccess) {
      // Add credits to user and update discount code usage
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        // Add credits to user
        await User.findByIdAndUpdate(
          payment.userId,
          {
            $inc: { credits: payment.credits },
            $push: {
              paymentHistory: {
                transactionId: payment_id,
                upaymentsTrackId: track_id,
                amount: payment.amount,
                originalAmount: payment.originalAmount,
                discountAmount: payment.discountAmount,
                credits: payment.credits,
                status: "completed",
                paymentMethod: payment_type || "unknown",
                upaymentsAuth: auth,
                upaymentsRef: ref,
                upaymentsReceiptId: receipt_id,
                upaymentsInvoiceId: invoice_id,
                transactionDate: transaction_date,
                webhookData: webhookData,
                discountCode: payment.discountCode
                  ? payment.discountCode.code
                  : null,
              },
            },
          },
          { session }
        );

        // Update discount code usage count if applicable
        if (payment.discountCode) {
          const incResult = await mongoose.model("DiscountCode").updateOne(
            {
              _id: payment.discountCode._id,
              $or: [
                { maxUses: null },
                { $expr: { $lt: ["$usedCount", "$maxUses"] } },
              ],
            },
            { $inc: { usedCount: 1 } },
            { session }
          );

          // Optional: log if limit was already reached (no increment performed)
          if (incResult.matchedCount === 0) {
            console.warn(
              `Discount code usage limit reached for ${payment.discountCode.code}; not incrementing usedCount`
            );
          }
        }

        // Persist the payment document update (e.g. marking it complete)
        await payment.save({ session });

        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }

      console.log(
        `✅ Payment successful: ${requested_order_id} - Added ${
          payment.credits
        } credits to user ${payment.userId}${
          payment.discountCode
            ? ` (Used discount: ${payment.discountCode.code})`
            : ""
        }`
      );
    } else {
      await payment.save();
      console.log(
        `❌ Payment failed: ${requested_order_id} - Result: ${result}`
      );
    }

    console.log(
      `Payment ${requested_order_id} updated to status: ${payment.status}`
    );
    return res.status(200).json({ message: "Webhook processed successfully" });
  } catch (error) {
    console.error("Webhook error:", error);
    next(error);
  }
};

// Get payment status
const getPaymentStatus = async (req, res, next) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const { orderId } = matchedData(req);

    const payment = await Payment.findOne({
      upaymentsOrderId: orderId,
    }).populate("discountCode");
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const user = await User.findById(payment.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const token = generateToken(user);
    return res.status(200).json({
      message: "Payment status retrieved successfully",
      payment: {
        orderId: payment.upaymentsOrderId,
        status: payment.status,
        amount: payment.amount,
        originalAmount: payment.originalAmount,
        discountAmount: payment.discountAmount,
        credits: payment.credits,
        discountCode: payment.discountCode ? payment.discountCode.code : null,
        createdAt: payment.createdAt,
      },
      newToken: token,
    });
  } catch (error) {
    next(error);
  }
};

// Get user credits
const getUserCredits = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select("credits paymentHistory");

    return res.status(200).json({
      message: "User credits retrieved successfully",
      credits: user.credits,
      paymentHistory: user.paymentHistory.slice(-10), // Last 10 payments
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPayment,
  handleWebhook,
  getPaymentStatus,
  getUserCredits,
};
