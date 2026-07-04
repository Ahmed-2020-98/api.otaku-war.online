const { Schema, model } = require("mongoose");

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "user", "gamer"],
      default: "gamer",
      required: true,
    },
    categories: {
      type: [Schema.Types.ObjectId],
      ref: "Category",
      required: false,
    },
    questions: {
      type: [Schema.Types.ObjectId],
      ref: "Question",
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    fullName: {
      type: String,
      required: false,
    },
    country: {
      type: String,
      required: false,
      enum: ["KW", "KSA", "UAE", "OM", "QA", "BH"],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
    },
    otpExpiry: {
      type: Date,
    },
    profilePicture: {
      type: String,
      default: "profile-1",
      enum: [
        "profile-1",
        "profile-2",
        "profile-3",
        "profile-4",
        "profile-5",
        "profile-6",
        "profile-7",
        "profile-8",
        "profile-9",
        "profile-10",
        "profile-11",
        "profile-12",
        "profile-13",
        "profile-14",
        "profile-15",
        "profile-16",
        "profile-17",
        "profile-18",
      ],
    },
    theme: {
      type: String,
      default: "light",
      enum: ["light", "dark"],
    },
    credits: {
      type: Number,
      default: 1,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "credits must be an integer",
      },
    },
    // upaymentsCustomerToken: {
    //   type: String,
    //   required: false,
    // },
    paymentHistory: [
      //FIXME: update the paymentHistory to refrence Payment model
      {
        transactionId: String,
        amount: Number,
        credits: Number,
        status: {
          type: String,
          enum: ["pending", "completed", "failed"],
          default: "pending",
        },
        paymentMethod: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    hasPlayedFirstGame: {
      type: Boolean,
      default: false,
    },
  },

  { timestamps: true }
);
userSchema.index({ _id: 1, credits: 1 });
userSchema.index({ otp: 1, otpExpiry: 1 });
// Note: username already has unique: true, which creates an index automatically

const User = model("User", userSchema);

module.exports = User;
