const express = require("express");
const questionRouter = express.Router();
const {
  createQuestion,
  getAllQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  approveQuestion,
  rejectQuestion,
  getQuestionsByCategory,
  getPendingQuestions,
  getApprovedQuestions,
  getRejectedQuestions,
  pendingQuestion,
} = require("../controllers/Question.controller");
const passport = require("passport");
const checkAdmin = require("../../middleware/CheckAdmin");
const { body, param } = require("express-validator");
const uploadImageMiddleware = require("../../middleware/UploadImage");
// Create Question
questionRouter.post(
  "/",
  uploadImageMiddleware,
  [
    body("question").optional(),
    body("englishQuestion").optional(),
    body("difficulty")
      .notEmpty()
      .withMessage("Difficulty is required")
      .trim()
      .escape()
      .isIn(["easy", "medium", "hard", "extreme"])
      .withMessage("Difficulty must be either easy, medium, hard, or extreme"),
    body("correctAnswer").notEmpty().withMessage("Correct Answer is required"),
    body("category")
      .notEmpty()
      .withMessage("Category is required")
      .isMongoId()
      .withMessage("Invalid Category"),
  ],
  (req, res, next) => {
    if (!req.body.question && !req.body.englishQuestion) {
      return res.status(400).json({
        message: "Question or English Question is required",
      });
    }
    next();
  },
  passport.authenticate("jwt", { session: false }),
  createQuestion
);

// Get All Questions
questionRouter.get("/", getAllQuestions);

questionRouter.get(
  "/pending",
  passport.authenticate("jwt", { session: false }),
  checkAdmin,
  getPendingQuestions
);

questionRouter.get(
  "/approved",
  passport.authenticate("jwt", { session: false }),
  checkAdmin,
  getApprovedQuestions
);

questionRouter.get(
  "/rejected",
  passport.authenticate("jwt", { session: false }),
  checkAdmin,
  getRejectedQuestions
);

// Get Question By Id
questionRouter.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid Question ID")],
  getQuestionById
);

// Update Question
questionRouter.put(
  "/:id",
  uploadImageMiddleware,
  [
    param("id").isMongoId().withMessage("Invalid Question ID"),
    body("question").notEmpty().withMessage("Question is required"),
    body("difficulty")
      .notEmpty()
      .withMessage("Difficulty is required")
      .trim()
      .escape(),
    body("correctAnswer").notEmpty().withMessage("Correct Answer is required"),
    body("category")
      .notEmpty()
      .withMessage("Category is required")
      .isMongoId()
      .withMessage("Invalid Category"),
  ],

  passport.authenticate("jwt", { session: false }),
  updateQuestion
);

// Delete Question
questionRouter.delete(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid Question ID")],
  passport.authenticate("jwt", { session: false }),
  checkAdmin,
  deleteQuestion
);

// Get Questions By Category
questionRouter.get(
  "/category/:id",
  [param("id").isMongoId().withMessage("Invalid Category ID")],
  passport.authenticate("jwt", { session: false }),
  getQuestionsByCategory
);

// Get Questions By User
// questionRouter.get("/user/:id", getQuestionsByUser);

// Approve Question
questionRouter.put(
  "/approve/:id",
  passport.authenticate("jwt", { session: false }),
  checkAdmin,
  approveQuestion
);

// Reject Question
questionRouter.put(
  "/reject/:id",
  passport.authenticate("jwt", { session: false }),
  checkAdmin,
  rejectQuestion
);

// Pending Question
questionRouter.put(
  "/pending/:id",
  passport.authenticate("jwt", { session: false }),
  checkAdmin,
  pendingQuestion
);
module.exports = questionRouter;
