const { matchedData } = require("express-validator");
const Game = require("../../models/Game");
const mongoose = require("mongoose");
const { handleValidationErrors } = require("../../utils/validationUtils");
const { MAX_CATEGORIES } = require("../../config/gameConfigs");
const { generateToken } = require("../../utils/mongoUtils");
const { groupQuestionsByCategory } = require("../../utils/gameHelpers");
const GameService = require("../../utils/gameService");
const User = require("../../models/User");
const Category = require("../../models/Category");

const createGame = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const validationError = handleValidationErrors(req, res);
    if (validationError) {
      await session.abortTransaction();
      return;
    }

    const { gameName, team1Name, team2Name, categoryIds } = matchedData(req);
    const createdBy = req.user._id;

    if (!Array.isArray(categoryIds) || categoryIds.length !== MAX_CATEGORIES) {
      await session.abortTransaction();
      return res.status(400).json({
        message: `Exactly ${MAX_CATEGORIES} categories must be provided`,
      });
    }

    try {
      // Validate user and categories
      const userWithCategories = await GameService.validateGameCreation(
        categoryIds,
        createdBy,
        session
      );

      await session.commitTransaction();

      // Check if this is the user's first game
      const user = await User.findById(createdBy).select("hasPlayedFirstGame");
      const isFirstGame = !user.hasPlayedFirstGame;

      // Process questions outside transaction
      const { allQuestions, flatQuestions } =
        await GameService.processQuestions(categoryIds, createdBy, isFirstGame);
      const groupedQuestions = groupQuestionsByCategory(
        allQuestions,
        userWithCategories.categories
      );

      // Create game in new transaction
      const gameSession = await mongoose.startSession();

      try {
        await gameSession.startTransaction();

        const { newGame, updatedUser } =
          await GameService.createGameWithTransaction(
            {
              gameName,
              team1Name,
              team2Name,
              categories: categoryIds,
              questions: flatQuestions.map((q) => q._id),
              createdBy,
            },
            gameSession,
            isFirstGame
          );

        await gameSession.commitTransaction();

        const token = generateToken(updatedUser);

        return res.status(201).json({
          message: "Game created successfully",
          game: {
            gameId: newGame[0]._id,
            gameName: newGame[0].gameName,
            team1Name: newGame[0].team1Name,
            team2Name: newGame[0].team2Name,
            questions: groupedQuestions,
            team1Score: 0,
            team2Score: 0,
          },
          newToken: token,
        });
      } catch (gameSessionError) {
        if (gameSession.inTransaction()) {
          await gameSession.abortTransaction();
        }
        throw gameSessionError;
      } finally {
        await gameSession.endSession();
      }
    } catch (serviceError) {
      // Only abort if the session is still in transaction
      if (session.inTransaction()) {
        await session.abortTransaction();
      }

      // Handle specific service errors
      if (serviceError.message === "User not found") {
        return res.status(404).json({ message: serviceError.message });
      }
      if (serviceError.message === "One or more categories not found") {
        return res.status(400).json({ message: serviceError.message });
      }
      if (serviceError.message === "Insufficient credits") {
        return res.status(402).json({ message: serviceError.message });
      }

      throw serviceError;
    }
  } catch (error) {
    // Only abort if the session is still in transaction
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    next(error);
  } finally {
    await session.endSession();
  }
};

const getGameById = async (req, res, next) => {
  try {
    const result = handleValidationErrors(req, res);
    if (result) {
      return;
    }

    const { id } = matchedData(req);
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid game ID" });
    }

    // Single optimized query with all populations and lean()
    const populatedGame = await Game.findOne({
      _id: id,
      createdBy: userId,
    })
      .populate({
        path: "questions",
        select:
          "question difficulty correctAnswer media answerMedia score englishAnswer range rangeNumber",
        populate: {
          path: "category",
          select: "name",
        },
      })
      .populate("categories", "name media logo")
      .lean();

    if (!populatedGame) {
      return res.status(404).json({ message: "Game not found" });
    }
    await Game.updateOne(
      { _id: id },
      { $inc: { playingCount: 1 } }
    );

    // Use populated categories directly (no separate query needed)
    const groupedQuestions = populatedGame.categories.reduce(
      (acc, category) => {
        const categoryQuestions = populatedGame.questions.filter(
          (question) =>
            question.category._id.toString() === category._id.toString()
        );
        acc[category.name] = {
          categoryName: category.name,
          categoryImage: category.media,
          logo: category.logo,
          questions: categoryQuestions.map((q) => {
            return {
              questionId: q._id,
              question: q.question,
              difficulty: q.difficulty,
              correctAnswer: q.correctAnswer,
              media: q.media,
              answerMedia: q.answerMedia,
              score: q.score,
              englishAnswer: q.englishAnswer,
              range: q.range,
              rangeNumber: q.rangeNumber,
            };
          }),
        };
        return acc;
      },
      {}
    );

    // Reuse user from req (already fetched by passport) for token
    const token = generateToken(req.user);

    return res.status(200).json({
      message: "Game fetched successfully",
      game: {
        gameId: populatedGame._id,
        gameName: populatedGame.gameName,
        team1Name: populatedGame.team1Name,
        team2Name: populatedGame.team2Name,
        questions: groupedQuestions,
        team1Score: 0,
        team2Score: 0,
      },
      newToken: token,
    });
  } catch (error) {
    next(error);
  }
};

const getUserGames = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // ✅ Add pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    // ✅ Use lean() for better performance
    const games = await Game.find({ createdBy: userId })
      .populate("categories", "name media logo")
      .populate(
        "questions",
        "question difficulty correctAnswer media answerMedia score englishAnswer range rangeNumber"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalGames = await Game.countDocuments({ createdBy: userId });

    return res.status(200).json({
      message: "User games fetched successfully",
      games,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalGames / limit),
        totalGames,
        hasNextPage: page < Math.ceil(totalGames / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createGame,
  getGameById,
  getUserGames,
};
