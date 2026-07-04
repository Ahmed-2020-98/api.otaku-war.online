const { MAX_CATEGORIES, MAX_QUESTIONS } = require("../config/gameConfigs");

const formatQuestion = (question) => ({
  questionId: question._id,
  question: question.question,
  difficulty: question.difficulty,
  correctAnswer: question.correctAnswer,
  media: question.media,
  answerMedia: question.answerMedia,
  score: question.score,
  englishAnswer: question.englishAnswer,
  range: question.range,
  rangeNumber: question.rangeNumber,
});

const groupQuestionsByCategory = (allQuestions, categories) => {
  const categoryMap = new Map();
  categories.forEach((cat) => {
    categoryMap.set(cat._id.toString(), cat);
  });

  return allQuestions.reduce((acc, categoryData) => {
    const category = categoryMap.get(categoryData.categoryId.toString());
    const categoryQuestions = categoryData.questions.reduce(
      (catAcc, difficultyData) => catAcc.concat(difficultyData.questions),
      []
    );

    acc[category.name] = {
      categoryId: categoryData.categoryId,
      categoryName: category.name,
      categoryImage: category.media,
      logo: category.logo,
      questions: categoryQuestions.map(formatQuestion),
    };
    return acc;
  }, {});
};

const validateQuestionAvailability = (allQuestions) => {
  if (allQuestions.length !== MAX_CATEGORIES) {
    return {
      error: true,
      message: `Not enough questions available`,
      required: MAX_QUESTIONS,
      available: allQuestions.length,
    };
  }

  for (const categoryData of allQuestions) {
    for (const difficultyData of categoryData.questions) {
      if (difficultyData.questions.length < difficultyData.count) {
        return {
          error: true,
          message: `Not enough questions available for category ${categoryData.categoryId} with difficulty ${difficultyData.score}`,
          required: difficultyData.count,
          available: difficultyData.questions.length,
        };
      }
    }
  }

  return { error: false };
};

const flattenQuestions = (allQuestions) => {
  return allQuestions.reduce((acc, categoryData) => {
    categoryData.questions.forEach((difficultyData) => {
      acc.push(...difficultyData.questions);
    });
    return acc;
  }, []);
};

module.exports = {
  formatQuestion,
  groupQuestionsByCategory,
  validateQuestionAvailability,
  flattenQuestions,
};
