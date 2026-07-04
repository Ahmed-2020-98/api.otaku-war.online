const { Schema, model } = require("mongoose");
const { MAX_CATEGORIES } = require("../config/gameConfigs");
const gameSchema = new Schema(
  {
    gameName: {
      type: String,
      required: true,
      trim: true,
    },
    team1Name: {
      type: String,
      required: true,
      trim: true,
    },
    team2Name: {
      type: String,
      required: true,
      trim: true,
    },
    categories: {
      type: [Schema.Types.ObjectId],
      ref: "Category",
      required: true,
      validate: {
        validator: function (categories) {
          return categories.length === MAX_CATEGORIES; // Must have exactly 6 categories
        },
        message: `Game must have exactly ${MAX_CATEGORIES} categories`,
      },
    },
    questions: {
      type: [Schema.Types.ObjectId],
      ref: "Question",
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    playingCount:{
      type:Number,
      default:0
    }
  },
  { timestamps: true }
);

// Index for better query performance
gameSchema.index({ createdBy: 1, createdAt: -1 }); // For getting user's recent games
gameSchema.index({ categories: 1 });

const Game = model("Game", gameSchema);

module.exports = Game;
