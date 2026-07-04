const MAX_CATEGORIES = 6;
const MAX_QUESTIONS_PER_CATEGORY = 7;
const MAX_TEAMS = 2;
const MAX_QUESTIONS = 42;
// Question tracking configuration
const QUESTION_HISTORY_DAYS = 30; // How many days back to check for seen questions
const ENABLE_QUESTION_TRACKING = true; // Feature flag to enable/disable tracking
const GAME_CREATION_CREDITS = 1;

const DEFAULT_TEAM_SCORE = 0;
module.exports = {
  MAX_CATEGORIES,
  MAX_QUESTIONS_PER_CATEGORY,
  MAX_TEAMS,
  MAX_QUESTIONS,
  QUESTION_HISTORY_DAYS,
  ENABLE_QUESTION_TRACKING,
  GAME_CREATION_CREDITS,
  DEFAULT_TEAM_SCORE,
};
