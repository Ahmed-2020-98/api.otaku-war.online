const { Schema, model } = require("mongoose");

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    media: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    questions: {
      type: [Schema.Types.ObjectId],
      ref: "Question",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    locked: {
      type: Boolean,
      default: false,
    },
    logo: {
      type: String,
      required: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      required: false,
    },
  },
  { timestamps: true }
);

categorySchema.index({ name: "text" });
categorySchema.index({ locked: 1 });
categorySchema.index({ isDeleted: 1 });

const Category = model("Category", categorySchema);

module.exports = Category;
