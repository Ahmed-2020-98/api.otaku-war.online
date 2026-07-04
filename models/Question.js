const { Schema, model } = require("mongoose");

const questionSchema = new Schema(
  {
    question: {
      type: String,
      required: false,
    },
    englishQuestion: {
      type: String,
      required: false,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "extreme"],
      default: "easy",
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    correctAnswer: {
      type: String,
      required: true,
    },
    media: {
      type: String,
      required: false,
    },
    score: {
      type: Number,
      required: true,
      default: function () {
        switch (this.difficulty) {
          case "easy":
            return 100;
          case "medium":
            return 300;
          case "hard":
            return 500;
          case "extreme":
            return 1000;
          default:
            return 100;
        }
      },
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      required: false,
    },
    answerMedia: {
      type: String,
      required: false,
    },
    range: {
      type: Boolean,
      default: false,
    },
    rangeNumber: {
      type: Number,
      required: false,
      default: 0,
    },
    englishAnswer: {
      type: String,
      required: false,
    },
    forFirstGame: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

questionSchema.index({ category: 1, score: 1 });
questionSchema.index({ category: 1, _id: 1 });
questionSchema.index({ status: 1, createdAt: -1 });
questionSchema.index({ status: 1, category: 1 });

// Pre-save hook to ensure score matches difficulty
questionSchema.pre("save", function (next) {
  // Only update score if difficulty has changed or score is not set
  if (this.isModified("difficulty") || !this.score) {
    switch (this.difficulty) {
      case "easy":
        this.score = 100;
        break;
      case "medium":
        this.score = 300;
        break;
      case "hard":
        this.score = 500;
        break;
      case "extreme":
        this.score = 1000;
        break;
      default:
        this.score = 100;
    }
  }
  next();
});

const Question = model("Question", questionSchema);

module.exports = Question;
