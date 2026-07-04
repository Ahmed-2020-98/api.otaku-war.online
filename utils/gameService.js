const Category = require("../models/Category");
const User = require("../models/User");
const mongoose = require("mongoose");
const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 1800 }); // 30 minutes cache
const { MAX_CATEGORIES } = require("../config/gameConfigs");
const { GAME_CREATION_CREDITS } = require("../config/gameConfigs");
const { ENABLE_QUESTION_TRACKING } = require("../config/gameConfigs");
const { QUESTION_HISTORY_DAYS } = require("../config/gameConfigs");
const { getUserSeenQuestions } = require("./gameUtils");
const { getQuestionsWithFallback } = require("./gameUtils");
const { validateQuestionAvailability } = require("./gameHelpers");
const { flattenQuestions } = require("./gameHelpers");
const Game = require("../models/Game");

const getCachedCategories = async (categoryIds) => {
  const cacheKey = `categories:${categoryIds.sort().join(",")}`;
  let categories = cache.get(cacheKey);

  if (!categories) {
    categories = await Category.find({
      _id: { $in: categoryIds },
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
      locked: true, // Only retrieve locked categories for games
    });
    cache.set(cacheKey, categories);
  }

  return categories;
};

class GameService {
  async validateGameCreation(categoryIds, userId, session = null) {
    const [userWithCategories] = await User.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(userId) },
      },
      {
        $lookup: {
          from: "categories",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                _id: {
                  $in: categoryIds.map((id) => new mongoose.Types.ObjectId(id)),
                },
                $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
                locked: true, // Only allow locked categories for games
              },
            },
          ],
          as: "categories",
        },
      },
      {
        $project: {
          _id: 1,
          credits: 1,
          username: 1,
          email: 1,
          "categories._id": 1,
          "categories.name": 1,
          "categories.media": 1,
          "categories.logo": 1,
        },
      },
    ]).session(session);

    if (!userWithCategories) {
      throw new Error("User not found");
    }

    if (userWithCategories.categories.length !== MAX_CATEGORIES) {
      throw new Error("One or more categories not found");
    }

    if (userWithCategories.credits < GAME_CREATION_CREDITS) {
      throw new Error("Insufficient credits");
    }

    return userWithCategories;
  }

  async processQuestions(categoryIds, userId, isFirstGame = false) {
    let seenQuestionIds = [];
    if (ENABLE_QUESTION_TRACKING) {
      seenQuestionIds = await getUserSeenQuestions(
        userId,
        QUESTION_HISTORY_DAYS
      );
    }

    console.log("isFirstGame in processQuestions", isFirstGame);
    const allQuestions = await getQuestionsWithFallback(
      categoryIds,
      seenQuestionIds,
      isFirstGame
    );
    const validation = validateQuestionAvailability(allQuestions);

    if (validation.error) {
      throw new Error(validation.message);
    }

    return {
      allQuestions,
      flatQuestions: flattenQuestions(allQuestions),
    };
  }

  async createGameWithTransaction(gameData, session, isFirstGame = false) {
    const newGame = await Game.create([gameData], { session });

    const updateData = { $inc: { credits: -GAME_CREATION_CREDITS } };

    // If this is the user's first game, mark hasPlayedFirstGame as true
    if (isFirstGame) {
      updateData.$set = { hasPlayedFirstGame: true };
    }

    await User.updateOne({ _id: gameData.createdBy }, updateData, { session });

    const updatedUser = await User.findById(gameData.createdBy)
      .session(session)
      .select(
        "-password -otp -otpExpiry -upaymentsCustomerToken -isVerified -paymentHistory"
      );

    return { newGame, updatedUser };
  }
}

module.exports = new GameService();
