const { Schema, model } = require("mongoose");

const paymentSchema = new Schema(
  {
    //FIXME: update the userId to user
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    upaymentsOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, "amount must be >= 0"],
      validate: {
        validator: Number.isFinite,
        message: "amount must be a finite number",
      },
    },
    originalAmount: {
      type: Number,
      required: true,
      min: [0, "originalAmount must be >= 0"],
      validate: {
        validator: Number.isFinite,
        message: "originalAmount must be a finite number",
      },
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: [0, "discountAmount must be >= 0"],
      validate: {
        validator: Number.isFinite,
        message: "discountAmount must be a finite number",
      },
    },
    discountCode: {
      type: Schema.Types.ObjectId,
      ref: "DiscountCode",
      default: null,
    },
    credits: {
      type: Number,
      required: true,
      min: [0, "credits must be >= 0"],
      validate: {
        validator: (v) => Number.isInteger(v),
        message: "credits must be an integer",
      },
    },
    currency: {
      type: String,
      default: "KWD",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["knet", "card", "apple-pay", "google-pay", "samsung-pay"],
    },
    upaymentsTransactionId: {
      type: String,
    },
    webhookData: {
      type: Schema.Types.Mixed,
    },
    returnUrl: {
      type: String,
      required: true,
    },
    cancelUrl: {
      type: String,
      required: true,
    },
    notificationUrl: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

paymentSchema.index(
  { upaymentsTransactionId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      upaymentsTransactionId: { $exists: true, $ne: null },
    },
  }
);
paymentSchema.index({ userId: 1, createdAt: -1 });
// Note: upaymentsOrderId already has unique: true, which creates an index automatically
paymentSchema.index({ status: 1, createdAt: -1 });

const Payment = model("Payment", paymentSchema);

module.exports = Payment;
