const { Schema, model } = require("mongoose");

const complaintSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    gameId: { type: Schema.Types.ObjectId, ref: "Game" },
    questionId: { type: Schema.Types.ObjectId, ref: "Question" },
    type: {
      type: String,
      enum: ["contactus", "reportissue", "other"],
      required: true,
    },
    country: { type: String },
    message: { type: String },
    fullName: { type: String },
    email: { type: String },
    phone: { type: String },
    status: {
      type: String,
      enum: ["pending", "resolved"],
      default: "pending",
    },
  },
  { timestamps: true }
);

complaintSchema.index({ type: 1, createdAt: -1 });
complaintSchema.index({ status: 1 });

const Complaint = model("Complaint", complaintSchema);

module.exports = Complaint;
