const Game = require("../models/Game");
const Question = require("../models/Question");
const mongoose = require("mongoose");

/**
 * Get user's previously seen questions from their game history
 */
const getUserSeenQuestions = async (userId, timeLimitDays = null) => {
  const query = {
    createdBy: userId,
  };

  if (timeLimitDays) {
    const timeLimit = new Date();
    timeLimit.setDate(timeLimit.getDate() - timeLimitDays);
    query.createdAt = { $gte: timeLimit };
  }

  const userGames = await Game.find(query).select("questions");
  const seenQuestionIds = userGames.reduce((acc, game) => {
    return acc.concat(game.questions);
  }, []);

  return seenQuestionIds;
};

/**
 * Get questions with fallback logic for when user has seen most questions
 */
const getQuestionsWithFallback = async (
  categoryIds,
  seenQuestionIds,
  isFirstGame = false
) => {
  const difficultyRequirements = [
    { score: 100, count: 2 },
    { score: 300, count: 2 },
    { score: 500, count: 2 },
    { score: 1000, count: 1 },
  ];

  // Most efficient: Use $sample with parallel execution
  const getRandomQuestionsOptimized = async (
    categoryIds,
    excludeSeenQuestions = true
  ) => {
    const promises = [];

    // Create all queries in parallel for maximum efficiency
    for (const categoryId of categoryIds) {
      for (const { score, count } of difficultyRequirements) {
        const matchCriteria = {
          category: new mongoose.Types.ObjectId(categoryId),
          score: score,
          // status: "approved", // Only get approved questions
        };

        // If it's first game, only get questions marked for first game
        if (isFirstGame) {
          matchCriteria.forFirstGame = true;
        }

        if (excludeSeenQuestions && seenQuestionIds.length > 0) {
          matchCriteria._id = { $nin: seenQuestionIds };
        }

        const queryPromise = Question.aggregate([
          { $match: matchCriteria },
          { $sample: { size: count } }, // Most efficient randomization
        ]).then((questions) => ({
          categoryId,
          score,
          count,
          questions,
        }));

        promises.push(queryPromise);
      }
    }

    // Execute all queries in parallel
    const results = await Promise.all(promises);
    console.log(
      "questions in getQuestionsWithFallback",
      results[0].questions[0]
    );
    // Group results by category
    const groupedResults = categoryIds.map((categoryId) => ({
      categoryId: new mongoose.Types.ObjectId(categoryId),
      questions: difficultyRequirements.map(({ score, count }) => {
        const result = results.find(
          (r) =>
            r.categoryId.toString() === categoryId.toString() &&
            r.score === score
        );
        return {
          score,
          count,
          questions: result ? result.questions : [],
        };
      }),
    }));

    return groupedResults;
  };

  try {
    // First try: exclude seen questions
    let questions = await getRandomQuestionsOptimized(categoryIds, true);

    // Check if we have enough questions
    const hasEnoughQuestions = questions.every((categoryData) =>
      categoryData.questions.every(
        (difficultyData) =>
          difficultyData.questions.length >= difficultyData.count
      )
    );

    if (!hasEnoughQuestions) {
      console.log("Not enough unseen questions, falling back to all questions");
      questions = await getRandomQuestionsOptimized(categoryIds, false);
    }

    return questions;
  } catch (error) {
    console.error("Error fetching randomized questions:", error);
    throw error;
  }
};

// Alternative: If you prefer the single aggregation approach but want better performance
const getQuestionsWithFallbackSingleQuery = async (
  categoryIds,
  seenQuestionIds
) => {
  const difficultyRequirements = [
    { score: 100, count: 2 },
    { score: 300, count: 2 },
    { score: 500, count: 2 },
    { score: 1000, count: 1 },
  ];

  const buildOptimizedAggregation = (excludeSeenQuestions = true) => {
    const matchStage = {
      category: {
        $in: categoryIds.map((id) => new mongoose.Types.ObjectId(id)),
      },
    };

    if (excludeSeenQuestions && seenQuestionIds.length > 0) {
      matchStage._id = { $nin: seenQuestionIds };
    }

    return [
      { $match: matchStage },
      // Use $sample at the document level for better performance
      {
        $group: {
          _id: { category: "$category", score: "$score" },
          questions: { $push: "$$ROOT" },
        },
      },
      {
        $group: {
          _id: "$_id.category",
          difficulties: {
            $push: {
              score: "$_id.score",
              questions: "$questions",
            },
          },
        },
      },
      {
        $project: {
          categoryId: "$_id",
          questions: {
            $map: {
              input: difficultyRequirements,
              as: "req",
              in: {
                score: "$$req.score",
                count: "$$req.count",
                questions: {
                  $let: {
                    vars: {
                      difficultyGroup: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$difficulties",
                              cond: { $eq: ["$$this.score", "$$req.score"] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: {
                      $cond: {
                        if: {
                          $gt: [
                            {
                              $size: {
                                $ifNull: ["$$difficultyGroup.questions", []],
                              },
                            },
                            "$$req.count",
                          ],
                        },
                        then: {
                          $slice: [
                            "$$difficultyGroup.questions",
                            "$$req.count",
                          ],
                        },
                        else: { $ifNull: ["$$difficultyGroup.questions", []] },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    ];
  };

  try {
    let questions = await Question.aggregate(buildOptimizedAggregation(true));

    const hasEnoughQuestions = questions.every((categoryData) =>
      categoryData.questions.every(
        (difficultyData) =>
          difficultyData.questions.length >= difficultyData.count
      )
    );

    if (!hasEnoughQuestions) {
      questions = await Question.aggregate(buildOptimizedAggregation(false));
    }

    return questions;
  } catch (error) {
    console.error("Error in single query approach:", error);
    throw error;
  }
};

module.exports = {
  getUserSeenQuestions,
  getQuestionsWithFallback,
  getQuestionsWithFallbackSingleQuery, // Alternative single-query approach
};
