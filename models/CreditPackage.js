const { Schema, model } = require("mongoose");

const creditPackageSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    credits: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "KWD",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true }
);

const CreditPackage = model("CreditPackage", creditPackageSchema);

module.exports = CreditPackage;
