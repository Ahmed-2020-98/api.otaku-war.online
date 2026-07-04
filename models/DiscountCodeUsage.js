const { Schema, model } = require("mongoose");

const discountCodeUsageSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    discountCodeId: {
      type: Schema.Types.ObjectId,
      ref: "DiscountCode",
      required: true,
    },
    usedAt: {
      type: Date,
      default: Date.now,
    },
    creditsAwarded: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Ensure a user can only use a discount code once
discountCodeUsageSchema.index(
  { userId: 1, discountCodeId: 1 },
  { unique: true }
);

// Index for efficient queries
discountCodeUsageSchema.index({ userId: 1 });
discountCodeUsageSchema.index({ discountCodeId: 1 });

const DiscountCodeUsage = model("DiscountCodeUsage", discountCodeUsageSchema);

module.exports = DiscountCodeUsage;
